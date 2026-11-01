// Orchestrates the two-level guarded pipeline:
//   Level 1 guardrail (classify + sanitize, fail closed)
//   -> retrieval (curated knowledge base only)
//   -> Level 2 answer model (streaming)
//   -> output deny-list filter (defense-in-depth)
// All errors are masked — callers only ever see generic refusals.

import { runGuardrail } from './guardrail';
import { runAnswer } from './answer';
import { filterAnswer } from './outputFilter';
import { REFUSAL_INJECTION, REFUSAL_OFF_TOPIC } from './prompts';
import type { ChatMessage } from './provider';

export type PipelineEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; refused: boolean };

export async function* runPipeline(history: ChatMessage[]): AsyncGenerator<PipelineEvent, void, unknown> {
  const lastUser = history[history.length - 1];
  if (!lastUser || lastUser.role !== 'user') {
    yield { type: 'done', refused: true };
    return;
  }

  // Level 1: guardrail. Fail closed on any verdict other than on-topic.
  const guard = await runGuardrail(lastUser.content);
  console.log(`[chat] guard verdict=${guard.verdict} allow=${guard.allow}`);
  if (!guard.allow) {
    const text = guard.verdict === 'off-topic' ? REFUSAL_OFF_TOPIC : REFUSAL_INJECTION;
    yield { type: 'delta', text };
    yield { type: 'done', refused: true };
    return;
  }

  // Level 2: answer model, streamed. Accumulate so the output filter can
  // inspect the complete reply before we commit to streaming it.
  let answer = '';
  try {
    for await (const delta of runAnswer(guard.sanitizedQuery, history.slice(0, -1))) {
      answer += delta;
    }
  } catch (err) {
    console.error('[chat] answer model call failed:', (err as Error).message);
    answer = '';
  }

  const safe = answer.length > 0 ? filterAnswer(answer) : REFUSAL_INJECTION;
  yield { type: 'delta', text: safe };
  yield { type: 'done', refused: false };
}
