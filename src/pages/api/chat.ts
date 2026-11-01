// POST /api/chat — the only server-rendered route on the site.
// Body: { messages: [{ role: 'user'|'assistant', content: string }] }
// Response: SSE stream of { type: 'delta', text } events, then { type: 'done' }.
// Errors are generic JSON — internals never leak to the client.

import type { APIRoute } from 'astro';
import { runPipeline } from '../../lib/chat/pipeline';
import { validateMessages, checkRateLimit, acquireStream, ValidationError, RateLimitError } from '../../lib/chat/ratelimit';
import { REFUSAL_UNAVAILABLE } from '../../lib/chat/prompts';

export const prerender = false;

const GENERIC_ERROR = { error: 'Something went wrong. Try again, or email contact@snaplabs.tech.' };

function jsonError(status: number, body: unknown = GENERIC_ERROR): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function sseStream(body: ReadableStream<Uint8Array>): Response {
  return new Response(body, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}

function encode(event: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Cloudflare may provide the real client IP via header; prefer Astro's.
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = clientAddress || forwarded?.split(',')[0]?.trim() || 'unknown';

  let messages;
  try {
    const body = await request.json();
    messages = validateMessages(body);
  } catch (err) {
    if (err instanceof ValidationError) return jsonError(400);
    return jsonError(400);
  }

  try {
    checkRateLimit(ip);
  } catch (err) {
    if (err instanceof RateLimitError) return jsonError(429, { error: 'Slow down a little — try again in a moment.' });
    return jsonError(500);
  }

  const release = acquireStream(ip);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runPipeline(messages, request.signal)) {
          controller.enqueue(encode(event));
        }
      } catch {
        // Masked: if anything unexpected happens mid-stream, send a safe refusal.
        controller.enqueue(encode({ type: 'delta', text: REFUSAL_UNAVAILABLE }));
        controller.enqueue(encode({ type: 'done', refused: true }));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
      release();
    },
    cancel() {
      release();
    },
  });
  return sseStream(stream);
};

export const GET: APIRoute = () => jsonError(405, { error: 'Method not allowed.' });
