# Agent Instructions & Conventions (`AGENTS.md`)

## Development & Server Lifecycle

When starting the dev server, always use background mode:

```bash
npx astro dev --background
```

Manage the background server with:
- Status check: `npx astro dev status`
- Read server logs: `npx astro dev logs`
- Stop server: `npx astro dev stop`

Always stop background processes before concluding sessions if ongoing testing is no longer required.

---

## Design System & Styling Conventions

All user interface code must adhere to the standards codified in [`DESIGN.md`](./DESIGN.md) and [`src/styles/global.css`](./src/styles/global.css):

1. **Aesthetic Tone:** Dark obsidian (`#09090b`), translucent cards (`rgba(18, 18, 22, 0.7)` with `blur(16px)`), subtle borders (`rgba(255, 255, 255, 0.08)`), and crimson accents (`#e11d48`).
2. **Typography Rules:**
   - Display/Headings: `font-serif` ([Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond))
   - Body/Interface: `Geist`
   - Metadata/Telemetry: `font-mono` (`Geist Mono`, `ui-monospace`, `JetBrains Mono`)
   - Section taglines use the `.tag-line` class (uppercase, letter-spaced, prefixed with a crimson line).
3. **Motion & Tactile Feedback:**
   - Interactive elements must provide `:active` press feedback (`transform: scale(0.97)` on buttons, `scale(0.99)` on cards).
   - Use custom easing curves (`cubic-bezier(0.23, 1, 0.32, 1)`) with durations under `250ms`. Never use `ease-in` for UI animations.
   - Ensure all animations run on GPU compositor properties (`transform`, `opacity`).
4. **Tailwind v4 & Variants:**
   - Tailwind CSS v4 is loaded via `@tailwindcss/vite`.
   - Use `class-variance-authority` (`cva`) and `clsx` for component states and badges.

---

## Content Collections & Data Architecture

- **Schema:** Defined in [`src/content.config.ts`](./src/content.config.ts) using Astro's Content Layer API and `astro/loaders`.
- **Projects Directory:** Located in [`src/content/projects/*.md`](./src/content/projects/).
- **Project Attribution Rule:** Do **not** assign individual authors to project cards in the UI or markdown files. SnapLabs projects are presented as collaborative creations of the independent engineering trio.
- **Team Members:** The 3 engineers are Nikhil Malisetty, Prem Swaroop, and Sree Teja Gunda — three real-life friends who talk tech and AI and engineer purpose-built tools to solve real-world friction. Their profiles, roles, and bios live in [`src/pages/index.astro`](./src/pages/index.astro) with avatars in `public/team/`. Avoid corporate "studio", "agency", or "collective" framing (see [`GLOSSARY.md`](./GLOSSARY.md)).

---

## Chatbot Architecture & Edge Runtime Conventions

All assistant code in `src/components/ChatWidget.tsx` and `src/lib/chat/*` must follow these architectural guardrails:

1. **Two-Level Model Hierarchy:**
   - **Level 1 Decision Guardrail (`decision.ts`):** Evaluates prompts via `POST /v1/systemone` with `clef-flash`. Runs in a single forward pass (<300ms) with typed outputs (`topic` and `threat_or_jailbreak`). It does **not** rewrite prompts or autoregressively generate text.
   - **Level 2 Grounded Answer Model (`answer.ts`):** Only invoked if Level 1 approves. Answers strictly using context from `src/content/projects/*.md` wrapped in `<user_message>` tags to neutralize indirect injection risks.
2. **Zero External AI SDKs & Native Edge Compatibility:**
   - Do **not** install Vercel AI SDK (`@ai-sdk/react`, `ai`), heavy vector databases, or native C++ SQLite addons (`better-sqlite3`).
   - Cloudflare Workers edge runtime has no writable disk and cannot run native Node binaries. Use native Web APIs (`fetch`, `ReadableStream`, `TextDecoder`) and in-memory data structures.
3. **In-Flight Rate Throttling (`ratelimit.ts`):**
   - 30 RPM token-bucket queue (1 token every 2000ms). Bursts are queued in-flight with progressive SSE status notifications (`{"type": "status", "text": "High traffic right now..."}`) rather than hard 429 rejections.
4. **Cloudflare Turnstile Bot Barrier (`turnstile.ts`):**
   - Chat input and quick questions unlock only after Turnstile completes.
   - Validated tokens are cached in-memory (30-minute TTL) so multi-turn chat questions reuse the verified session without Cloudflare single-use duplicate token errors.
   - Bypassed automatically when `TURNSTILE_SECRET_KEY` is omitted from `.env`.

---

## Pre-Completion Verification

Before finishing any task that changes code, templates, or styles, you **must**:
1. Run `npm run check` (or `npm run build`) to verify clean TypeScript compilation, content collection syncing, and zero Astro or Vite errors.
2. Confirm the build output passes with code `0`.

---

## Documentation & Architecture Records

- Full Astro Documentation: https://docs.astro.build
- Routing: https://docs.astro.build/en/guides/routing/
- Astro Components: https://docs.astro.build/en/basics/astro-components/
- React Integration: https://docs.astro.build/en/guides/integrations-guide/react/
- Content Collections: https://docs.astro.build/en/guides/content-collections/
- Styling: https://docs.astro.build/en/guides/styling/
- **Architecture Decision Records (ADRs):**
  - [`docs/adr/0001-react-and-crt-telemetry-island.md`](./docs/adr/0001-react-and-crt-telemetry-island.md)
  - [`docs/adr/0002-system-one-decision-guardrail.md`](./docs/adr/0002-system-one-decision-guardrail.md)
  - [`docs/adr/0003-turnstile-bot-mitigation-and-rate-throttler.md`](./docs/adr/0003-turnstile-bot-mitigation-and-rate-throttler.md)

---

## Agent Skills

### Issue Tracker
Issues tracked in Linear (`mugguru-monagallu` / project `snaplabs.tech` / team `AD`). See [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md).

### Triage Labels
Canonical 5-role triage vocabulary in Linear. See [`docs/agents/triage-labels.md`](./docs/agents/triage-labels.md).

### Domain Docs
Single-context layout (`GLOSSARY.md` + `docs/adr/`). See [`docs/agents/domain.md`](./docs/agents/domain.md).
