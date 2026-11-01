// Cloudflare Turnstile token verification helper.
// Bypassed automatically when TURNSTILE_SECRET_KEY is absent or in test environments.

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
}

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

    return { success: true };
  } catch (err) {
    console.error('[turnstile] verification error:', (err as Error).message);
    return { success: false, error: 'Turnstile verification error.' };
  }
}
