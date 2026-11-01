// Environment variable reader for Node.js runtime.
// In Node.js (development and production standalone), all secrets and configs
// are directly available on process.env.

export function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  const globalVal = (globalThis as unknown as Record<string, unknown>)[key];
  if (typeof globalVal === 'string') return globalVal;

  return undefined;
}
