// Input validation + soft, in-memory rate limiting.
//
// Caveat: on serverless/edge (Cloudflare Workers) memory is per-instance, so
// this is a first layer only. For hard limits, add Cloudflare WAF rules later.

import type { ChatMessage } from './provider';

export const MAX_MESSAGES = 12;
export const MAX_MESSAGE_CHARS = 1000;
export const MAX_TOTAL_CHARS = 4000;

export class ValidationError extends Error {}
export class RateLimitError extends Error {}

export function validateMessages(body: unknown): ChatMessage[] {
  if (typeof body !== 'object' || body === null || !Array.isArray((body as { messages?: unknown }).messages)) {
    throw new ValidationError('body must be { messages: [...] }');
  }
  const messages = (body as { messages: unknown[] }).messages;
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    throw new ValidationError(`messages must contain 1-${MAX_MESSAGES} entries`);
  }
  let total = 0;
  const cleaned: ChatMessage[] = [];
  for (const m of messages) {
    if (typeof m !== 'object' || m === null) throw new ValidationError('invalid message');
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') throw new ValidationError('invalid role');
    if (typeof content !== 'string' || content.length === 0) throw new ValidationError('invalid content');
    if (content.length > MAX_MESSAGE_CHARS) throw new ValidationError('message too long');
    total += content.length;
    if (total > MAX_TOTAL_CHARS) throw new ValidationError('conversation too long');
    cleaned.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  // The last message must be from the user.
  if (cleaned[cleaned.length - 1].role !== 'user') {
    throw new ValidationError('last message must be from the user');
  }
  return cleaned;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
  activeStreams: number;
}

const BUCKET_CAPACITY = 10; // requests per window
const REFILL_MS = 30_000; // one token per 30s
const WINDOW_MS = 5 * 60_000;
const MAX_ACTIVE_STREAMS = 1;

const buckets = new Map<string, Bucket>();

function getBucket(ip: string): Bucket {
  let b = buckets.get(ip);
  if (!b) {
    b = { tokens: BUCKET_CAPACITY, lastRefill: Date.now(), activeStreams: 0 };
    buckets.set(ip, b);
    // Opportunistic cleanup so the map doesn't grow forever.
    if (buckets.size > 10_000) {
      const now = Date.now();
      for (const [key, val] of buckets) {
        if (now - val.lastRefill > WINDOW_MS && val.activeStreams === 0) buckets.delete(key);
      }
    }
  }
  const now = Date.now();
  const elapsed = now - b.lastRefill;
  if (elapsed > 0) {
    b.tokens = Math.min(BUCKET_CAPACITY, b.tokens + (elapsed / REFILL_MS));
    b.lastRefill = now;
  }
  return b;
}

export function checkRateLimit(ip: string): void {
  const b = getBucket(ip);
  if (b.activeStreams >= MAX_ACTIVE_STREAMS || b.tokens < 1) {
    throw new RateLimitError('too many requests');
  }
  b.tokens -= 1;
}

export function acquireStream(ip: string): () => void {
  const b = getBucket(ip);
  b.activeStreams += 1;
  return () => {
    b.activeStreams = Math.max(0, b.activeStreams - 1);
  };
}
