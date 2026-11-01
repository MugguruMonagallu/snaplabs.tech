// Thin provider-agnostic wrapper around an LLM API.
// Supports two wire formats, selected by CHAT_API_FORMAT ('anthropic' |
// 'openai') or auto-detected from CHAT_API_BASE_URL:
//   - anthropic: POST {base}/messages, x-api-key header, SSE content_block_delta
//   - openai:    POST {base}/chat/completions, Bearer auth, SSE choices[].delta.content
// Config comes from env vars read LAZILY at request time (never at module
// top-level) so CI builds succeed without secrets.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  format: 'anthropic' | 'openai';
}

type ApiFormat = 'anthropic' | 'openai';

function detectFormat(baseUrl: string, explicit: string | undefined): ApiFormat {
  if (explicit === 'anthropic' || explicit === 'openai') return explicit;
  return /anthropic/i.test(baseUrl) ? 'anthropic' : 'openai';
}

export function getChatConfig(model: 'guard' | 'answer'): ChatConfig {
  const baseUrl = (process.env.CHAT_API_BASE_URL ?? 'https://api.anthropic.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.CHAT_API_KEY ?? '';
  const modelName = model === 'guard'
    ? (process.env.CHAT_GUARD_MODEL ?? 'claude-haiku-4-5')
    : (process.env.CHAT_ANSWER_MODEL ?? 'claude-sonnet-4-5');
  return { baseUrl, apiKey, model: modelName, format: detectFormat(baseUrl, process.env.CHAT_API_FORMAT) };
}

export class ProviderError extends Error {}

function splitMessages(messages: ChatMessage[]): { system?: string; rest: { role: string; content: string }[] } {
  return {
    system: messages.find((m) => m.role === 'system')?.content,
    rest: messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
  };
}

function headers(config: ChatConfig): Record<string, string> {
  return config.format === 'anthropic'
    ? { 'content-type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' }
    : { 'content-type': 'application/json', authorization: `Bearer ${config.apiKey}` };
}

function endpoint(config: ChatConfig): string {
  return config.format === 'anthropic' ? `${config.baseUrl}/messages` : `${config.baseUrl}/chat/completions`;
}

function body(config: ChatConfig, messages: ChatMessage[], maxTokens: number, stream: boolean): string {
  const { system, rest } = splitMessages(messages);
  if (config.format === 'anthropic') {
    return JSON.stringify({ model: config.model, max_tokens: maxTokens, stream, messages: rest, system });
  }
  return JSON.stringify({
    model: config.model,
    max_tokens: maxTokens,
    stream,
    messages: system ? [{ role: 'system', content: system }, ...rest] : rest,
  });
}

async function post(config: ChatConfig, messages: ChatMessage[], maxTokens: number, stream: boolean): Promise<Response> {
  if (!config.apiKey) {
    throw new ProviderError('CHAT_API_KEY is not configured');
  }
  const res = await fetch(endpoint(config), {
    method: 'POST',
    headers: headers(config),
    body: body(config, messages, maxTokens, stream),
  });
  if (!res.ok) {
    throw new ProviderError(`provider responded ${res.status}`);
  }
  return res;
}

/**
 * Non-streaming completion. Returns the assistant text.
 * Throws ProviderError on any failure — callers must mask details.
 */
export async function complete(config: ChatConfig, messages: ChatMessage[], maxTokens: number): Promise<string> {
  const res = await post(config, messages, maxTokens, false);
  const data = (await res.json()) as Record<string, unknown>;
  if (data.error) throw new ProviderError('provider returned an error');
  if (config.format === 'anthropic') {
    const content = (data.content as { type: string; text?: string }[] | undefined) ?? [];
    return content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
  }
  const choice = (data.choices as { message?: { content?: string } }[] | undefined)?.[0];
  return choice?.message?.content ?? '';
}

/**
 * Streaming completion. Yields text deltas as they arrive.
 * Throws ProviderError on any failure — callers must mask details.
 */
export async function* streamComplete(
  config: ChatConfig,
  messages: ChatMessage[],
  maxTokens: number,
): AsyncGenerator<string, void, unknown> {
  const res = await post(config, messages, maxTokens, true);
  if (!res.body) throw new ProviderError('provider returned no body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const event = JSON.parse(payload) as Record<string, unknown>;
        if (config.format === 'anthropic') {
          const delta = event.delta as { type?: string; text?: string } | undefined;
          if (event.type === 'content_block_delta' && delta?.type === 'text_delta' && delta.text) {
            yield delta.text;
          }
        } else {
          const choices = event.choices as { delta?: { content?: string } }[] | undefined;
          const text = choices?.[0]?.delta?.content;
          if (text) yield text;
        }
      } catch {
        // Ignore malformed SSE lines.
      }
    }
  }
}
