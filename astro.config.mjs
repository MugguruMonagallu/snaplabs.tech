// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://snaplabs.tech',
  // Astro 5/7: 'static' is hybrid-by-default — pages prerender unless a route
  // opts out with `export const prerender = false` (see src/pages/api/chat.ts).
  output: 'static',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    host: true,
    port: 4321,
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

