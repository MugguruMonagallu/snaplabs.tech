// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Astro 7: 'static' is hybrid-by-default — pages prerender unless a route
  // opts out with `export const prerender = false` (see src/pages/api/chat.ts).
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});
