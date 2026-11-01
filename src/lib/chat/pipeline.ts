// Orchestrates the two-level guarded pipeline:
//   Level 1 guardrail (System One Decision Guardrail, fail closed)
//   -> retrieval (curated knowledge base only)
//   -> Level 2 answer model (progressive token streaming)
//   -> output deny-list filter (defense-in-depth replacement)
// All internal errors are masked — callers only ever see clean refusals.

import { runGuardrail } from './guardrail';
import { runAnswer } from './answer';
import { isAnswerSafe } from './outputFilter';
import { REFUSAL_FILTERED, REFUSAL_INJECTION, REFUSAL_OFF_TOPIC } from './prompts';
import type { ChatMessage } from './provider';

export type PipelineEvent =
  | { type: 'delta'; text: string }
  | { type: 'replace'; text: string }
  | { type: 'done'; refused: boolean };

export async function* runPipeline(
  history: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<PipelineEvent, void, unknown> {
  const lastUser = history[history.length - 1];
  if (!lastUser || lastUser.role !== 'user') {
    yield { type: 'done', refused: true };
    return;
  }

  // Level 1: System One decision guardrail. Fail closed on any non-allowed verdict.
  const guard = await runGuardrail(lastUser.content, signal);
  if (!guard.allow) {
    const text = guard.verdict === 'off-topic' ? REFUSAL_OFF_TOPIC : REFUSAL_INJECTION;
    yield { type: 'delta', text };
    yield { type: 'done', refused: true };
    return;
  }

  // Level 2: Answer model streamed progressively token by token.
  let fullAnswer = '';
  try {
    for await (const delta of runAnswer(guard.sanitizedQuery, history.slice(0, -1), signal)) {
      if (signal?.aborted) return;
      fullAnswer += delta;
      yield { type: 'delta', text: delta };
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError' || signal?.aborted) return;
    console.error('[chat] answer model call failed:', (err as Error).message);
    if (!fullAnswer) {
      yield { type: 'delta', text: REFUSAL_INJECTION };
      yield { type: 'done', refused: true };
      return;
    }
  }

  // Level 3 Defense-in-depth: If the generated answer leaks forbidden names or stack details,
  // emit a replacement event to clean the client message and refuse.
  if (fullAnswer.length > 0 && !isAnswerSafe(fullAnswer)) {
    console.warn('[chat] answer failed output filter — replacing with safe refusal');
    yield { type: 'replace', text: REFUSAL_FILTERED };
    yield { type: 'done', refused: true };
    return;
  }

  yield { type: 'done', refused: false };
}
