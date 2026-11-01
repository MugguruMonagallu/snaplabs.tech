// Cloudflare Turnstile token verification helper.
// Bypassed automatically when TURNSTILE_SECRET_KEY is absent or in test environments.

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
}

// In-memory cache for validated tokens during a single active chat session (30m TTL).
// Cloudflare's siteverify invalidates tokens after single-use, but a user's multi-turn
// chat session presents the initial verified token across subsequent questions.
const verifiedTokens = new Map<string, number>();
const TOKEN_TTL_MS = 30 * 60 * 1000;

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string,
): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Bypassed when secret key is not configured or in test mode
  if (!secretKey || process.env.NODE_ENV === 'test') {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Missing Turnstile verification token.' };
  }

  // Fast path: Token was already validated with Cloudflare during this session
  const now = Date.now();
  const expiresAt = verifiedTokens.get(token);
  if (expiresAt && expiresAt > now) {
    return { success: true };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp && remoteIp !== 'unknown') {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      console.error(`[turnstile] verification request failed with HTTP ${res.status}`);
      return { success: false, error: 'Turnstile verification service unreachable.' };
    }

    const data = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
      challenge_ts?: string;
      hostname?: string;
    };

    if (!data.success) {
      const errCodes = data['error-codes']?.join(', ') ?? 'unknown';
      console.warn(`[turnstile] verification rejected: ${errCodes}`);
      return { success: false, error: 'Turnstile challenge failed or token expired.' };
    }

    // Prune stale entries if cache grows
    if (verifiedTokens.size > 1000) {
      const currentTime = Date.now();
      for (const [k, exp] of verifiedTokens) {
        if (exp <= currentTime) verifiedTokens.delete(k);
      }
    }
    verifiedTokens.set(token, Date.now() + TOKEN_TTL_MS);

    return { success: true };
  } catch (err) {
    console.error('[turnstile] verification error:', (err as Error).message);
    return { success: false, error: 'Turnstile verification error.' };
  }
}
