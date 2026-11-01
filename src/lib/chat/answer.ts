// Level 2 of the pipeline: the answer model. It only ever sees the curated
// knowledge base plus delimiter-wrapped, untrusted user content.

import { streamComplete, getChatConfig } from './provider';
import { ANSWER_SYSTEM_PROMPT } from './prompts';
import { buildContext } from './retrieval';
import type { ChatMessage } from './provider';

const MAX_HISTORY_TURNS = 6;

function wrapUser(text: string): string {
  return `<user_message>\n${text}\n</user_message>`;
}

export async function* runAnswer(
  sanitizedQuery: string,
  history: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const config = getChatConfig('answer');
  const context = buildContext(sanitizedQuery, 3);
  const system = ANSWER_SYSTEM_PROMPT.replace('{context}', context);

  // Cap history to the most recent turns; every prior user turn is
  // delimiter-wrapped so it is treated as data, never as instructions.
  const recent = history.slice(-MAX_HISTORY_TURNS * 2);
  const messages: ChatMessage[] = recent.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.role === 'user' ? wrapUser(m.content) : m.content,
  }));
  messages.push({ role: 'user', content: wrapUser(sanitizedQuery) });

  yield* streamComplete(config, [{ role: 'system', content: system }, ...messages], 1024, signal);
}
