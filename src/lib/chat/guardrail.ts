// Level 1 of the pipeline: a cheap, fast model that classifies the incoming
// user message and sanitizes it. It never composes answers — it only gates.
// Injection / off-topic messages are refused with canned text and never
// reach Level 2 (saves cost and kills most jailbreaks before they start).

import { complete, getChatConfig, ProviderError } from './provider';
import { GUARD_SYSTEM_PROMPT } from './prompts';

export type GuardVerdict = 'on-topic' | 'off-topic' | 'injection';

export interface GuardResult {
  allow: boolean;
  verdict: GuardVerdict;
  sanitizedQuery: string;
}

interface GuardJson {
  allow?: boolean;
  verdict?: string;
  sanitizedQuery?: string;
}

function parseVerdict(raw: string, original: string): GuardResult {
  try {
    // Models often wrap JSON in ```json fences or add prose around it —
    // extract the first JSON object before parsing.
    const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw new Error('no JSON object');
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as GuardJson;
    const verdict = parsed.verdict === 'off-topic' || parsed.verdict === 'injection' ? parsed.verdict : 'on-topic';
    const sanitized = typeof parsed.sanitizedQuery === 'string' && parsed.sanitizedQuery.trim().length > 0
      ? parsed.sanitizedQuery.trim().slice(0, 1000)
      : original;
    return { allow: verdict === 'on-topic', verdict, sanitizedQuery: sanitized };
  } catch {
    // If the guard model fails to return valid JSON, fail closed:
    // treat as injection so the request never reaches the answer model.
    return { allow: false, verdict: 'injection', sanitizedQuery: '' };
  }
}

export async function runGuardrail(userMessage: string): Promise<GuardResult> {
  const config = getChatConfig('guard');
  try {
    const raw = await complete(
      config,
      [
        { role: 'system', content: GUARD_SYSTEM_PROMPT },
        { role: 'user', content: `<user_message>\n${userMessage}\n</user_message>` },
      ],
      160,
    );
    return parseVerdict(raw, userMessage);
  } catch (err) {
    if (err instanceof ProviderError) {
      // Provider failure on the guardrail: fail closed, refuse.
      // Logged server-side only — the client just sees the canned refusal.
      console.error('[chat] guardrail provider call failed:', err.message);
      return { allow: false, verdict: 'injection', sanitizedQuery: '' };
    }
    throw err;
  }
}
