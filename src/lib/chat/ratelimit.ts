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

const BUCKET_CAPACITY = 10; // requests per window per IP
const REFILL_MS = 30_000; // one token per 30s per IP
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

// ---------------------------------------------------------------------------
// Global Provider Rate Throttler & In-Flight Queue
// Model quota is 30 requests per minute (1 token every 2,000ms).
// ---------------------------------------------------------------------------

interface GlobalQueueItem {
  resolve: () => void;
  reject: (err: Error) => void;
  signal?: AbortSignal;
}

export const GLOBAL_RPM_LIMIT = 30;
export const GLOBAL_REFILL_MS = 2000; // 60,000ms / 30 = 2,000ms per request
export const MAX_GLOBAL_QUEUE = 20;

let globalTokens = GLOBAL_RPM_LIMIT;
let lastGlobalRefill = Date.now();
const globalQueue: GlobalQueueItem[] = [];
let refillTimer: ReturnType<typeof setInterval> | null = null;

function refillGlobalTokens(): void {
  const now = Date.now();
  const elapsed = now - lastGlobalRefill;
  if (elapsed >= GLOBAL_REFILL_MS) {
    const tokensToAdd = Math.floor(elapsed / GLOBAL_REFILL_MS);
    globalTokens = Math.min(GLOBAL_RPM_LIMIT, globalTokens + tokensToAdd);
    lastGlobalRefill = now;
  }
}

function processGlobalQueue(): void {
  refillGlobalTokens();
  while (globalTokens >= 1 && globalQueue.length > 0) {
    const next = globalQueue.shift();
    if (!next) break;
    if (next.signal?.aborted) continue;
    globalTokens -= 1;
    next.resolve();
  }
  if (globalQueue.length === 0 && refillTimer) {
    clearInterval(refillTimer);
    refillTimer = null;
  }
}

export interface AcquireSlotOptions {
  signal?: AbortSignal;
  onWait?: () => void;
}

/**
 * Acquires a slot from the global 30 RPM model quota.
 * If slots are exhausted, holds in-flight, triggers onWait, and resolves as soon
 * as a token refills.
 */
export async function acquireGlobalSlot(options: AcquireSlotOptions = {}): Promise<void> {
  const { signal, onWait } = options;
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  refillGlobalTokens();

  if (globalTokens >= 1 && globalQueue.length === 0) {
    globalTokens -= 1;
    return;
  }

  if (globalQueue.length >= MAX_GLOBAL_QUEUE) {
    throw new RateLimitError('Global request queue is full. Try again in a moment.');
  }

  if (onWait) {
    try {
      onWait();
    } catch {
      // Ignore if caller failed during notification
    }
  }

  return new Promise<void>((resolve, reject) => {
    const item: GlobalQueueItem = {
      resolve,
      reject,
      signal,
    };

    if (signal) {
      const onAbort = () => {
        signal.removeEventListener('abort', onAbort);
        const idx = globalQueue.indexOf(item);
        if (idx !== -1) {
          globalQueue.splice(idx, 1);
        }
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }

    globalQueue.push(item);

    if (!refillTimer) {
      refillTimer = setInterval(processGlobalQueue, 250);
    }
  });
}

/**
 * Diagnostic helper for testing: inspect or reset current global tokens.
 */
export function _resetGlobalTokensForTesting(tokens = GLOBAL_RPM_LIMIT): void {
  globalTokens = tokens;
  lastGlobalRefill = Date.now();
  globalQueue.length = 0;
  if (refillTimer) {
    clearInterval(refillTimer);
    refillTimer = null;
  }
}
