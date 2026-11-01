import fs from 'node:fs';
import path from 'node:path';

// In container environments (such as OpenShip) running Astro with @astrojs/cloudflare,
// astro preview launches Miniflare/workerd which loads environment variables from
// dist/server/wrangler.json (vars) and .env.
// This script bridges container environment variables into both locations before workerd starts.
const keys = Object.keys(process.env).filter(
  (k) =>
    k.startsWith('CHAT_') ||
    k.startsWith('TURNSTILE_') ||
    k.startsWith('PUBLIC_')
);

if (keys.length > 0) {
  // 1. Write .env if absent
  if (!fs.existsSync('.env')) {
    const content = keys.map((k) => `${k}=${process.env[k]}`).join('\n') + '\n';
    fs.writeFileSync('.env', content);
  }

  // 2. Inject into dist/server/wrangler.json (which Miniflare workerd reads directly)
  const wranglerPath = path.resolve('dist/server/wrangler.json');
  if (fs.existsSync(wranglerPath)) {
    try {
      const wranglerJson = JSON.parse(fs.readFileSync(wranglerPath, 'utf8'));
      wranglerJson.vars = wranglerJson.vars || {};
      for (const k of keys) {
        wranglerJson.vars[k] = process.env[k];
      }
      fs.writeFileSync(wranglerPath, JSON.stringify(wranglerJson, null, 2));
      console.log(`[startup] Injected ${keys.length} environment variables into wrangler.json vars and .env for workerd.`);
    } catch (err) {
      console.error('[startup] Failed to update wrangler.json vars:', err);
    }
  }
}
