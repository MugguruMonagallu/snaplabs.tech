# 0004. Native Node.js Server Adapter on OpenShip

## Context
SnapLabs is hosted on an independent Ubuntu virtual machine alongside our other purpose-built projects (`rera-sentinel`, `tv-show-tracker`, and `rera-admin`), managed via OpenShip in Docker containers. The Astro site was previously configured with `@astrojs/cloudflare`. When deployed to an OpenShip Docker container, this required launching `astro preview` (Miniflare and `workerd`) to emulate the Cloudflare Workers runtime. In this emulation layer, Node's standard `process.env` is unpopulated in the worker isolate, necessitating bridging scripts and `wrangler.json` mutations to inject environment secrets.

## Decision
1. **Adopt `@astrojs/node` in `standalone` mode**:
   - Replace `@astrojs/cloudflare` with `@astrojs/node` configured with `mode: 'standalone'`.
   - Retain hybrid `output: 'static'` so that marketing pages (`/`), markdown project collections, and portfolio content remain pre-rendered static HTML in `dist/client/`. Only dynamic endpoints (`/api/chat`) execute on demand in `dist/server/`.
2. **Unified Static & SSR Serving via `entry.mjs`**:
   - In standalone mode, `dist/server/entry.mjs` is a self-contained Node.js HTTP server that serves static assets from `dist/client/` with immutable caching headers and routes dynamic requests to Astro's SSR engine.
   - Point `"start"` and `"preview"` in `package.json` to `node ./dist/server/entry.mjs`, allowing OpenShip's container runner to launch the production Node server directly on `PORT=4321`.
3. **Retire Cloudflare Shims**:
   - Remove `scripts/pre-preview.js`, `.wrangler/`, and Miniflare bridging.
   - Simplify `src/lib/chat/env.ts` to read environment variables directly from native `process.env`.

## Consequences
- Eliminates ~40MB of Cloudflare Workers (`workerd`) emulation binaries and runtime overhead.
- Container environment variables injected by OpenShip work out-of-the-box in Node without any `.env` generation or bridging.
- Colocates with existing Node/Python workloads on the OpenShip VM with a unified reverse-proxy architecture (OpenResty -> Node:4321).
- Unlocks future server-side optimizations (e.g. streaming Node pipelines) without Cloudflare edge isolate restrictions.
