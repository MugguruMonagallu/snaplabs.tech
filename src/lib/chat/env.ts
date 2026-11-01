import { getSecret } from 'astro:env/server';

export function getEnv(key: string): string | undefined {
  try {
    const val = getSecret(key);
    if (val) return val;
  } catch {
    // fallback if outside request context or not initialized
  }
  return process.env[key];
}
