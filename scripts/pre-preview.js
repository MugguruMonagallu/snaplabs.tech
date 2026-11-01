import fs from 'node:fs';

// In container environments (such as OpenShip) running Astro with @astrojs/cloudflare,
// astro preview launches Miniflare/workerd which loads environment variables from .env.
// This script bridges container environment variables into .env before workerd starts.
const keys = Object.keys(process.env).filter(
  (k) =>
    k.startsWith('CHAT_') ||
    k.startsWith('TURNSTILE_') ||
    k.startsWith('PUBLIC_')
);

if (keys.length > 0 && !fs.existsSync('.env')) {
  const content = keys.map((k) => `${k}=${process.env[k]}`).join('\n') + '\n';
  fs.writeFileSync('.env', content);
  console.log(`[startup] Injected ${keys.length} container environment variables into .env for workerd.`);
}
