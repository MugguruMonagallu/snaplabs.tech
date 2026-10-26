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
   - Body/Interface: `Plus Jakarta Sans`
   - Metadata/Telemetry: `font-mono` (`ui-monospace` / `JetBrains Mono`)
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
- **Project Attribution Rule:** Do **not** assign individual authors to project cards in the UI or markdown files. SnapLabs projects are presented as collaborative creations of the collective.
- **Team Members:** The 3 founding engineers are Nikhil Malisetty, Prem Swaroop, and Sree Teja Gunda. Their profiles, roles, and bios live in [`src/pages/index.astro`](./src/pages/index.astro) with avatars in `public/team/`.

---

## Pre-Completion Verification

Before finishing any task that changes code, templates, or styles, you **must**:
1. Run `npm run build` to verify clean compilation, content collection syncing, and zero TypeScript or Vite errors.
2. Confirm the build output passes with code `0`.

---

## Documentation

- Full Astro Documentation: https://docs.astro.build
- Routing: https://docs.astro.build/en/guides/routing/
- Astro Components: https://docs.astro.build/en/basics/astro-components/
- React Integration: https://docs.astro.build/en/guides/integrations-guide/react/
- Content Collections: https://docs.astro.build/en/guides/content-collections/
- Styling: https://docs.astro.build/en/guides/styling/

---

## Agent Skills

### Issue Tracker
Issues tracked in Linear (`mugguru-monagallu` / project `snaplabs.tech` / team `AD`). See [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md).

### Triage Labels
Canonical 5-role triage vocabulary in Linear. See [`docs/agents/triage-labels.md`](./docs/agents/triage-labels.md).

### Domain Docs
Single-context layout (`GLOSSARY.md` + `docs/adr/`). See [`docs/agents/domain.md`](./docs/agents/domain.md).
