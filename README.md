# ⚡ SnapLabs (`snaplabs.tech`)

> **Independent engineering trio building purpose-built software to solve real-world friction.**

[![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🧭 Overview

**SnapLabs** is an independent engineering project by three friends in real life (Nikhil, Prem, and Sree Teja). We talk constantly about technology, emerging AI systems, and software craft. When we spot broken workflows or friction in daily life, we engineer single-purpose tools to solve them — avoiding corporate bloat in favor of tactile performance, zero-knowledge security, and grounded spatial systems.

This repository powers the official website and portfolio at [snaplabs.tech](https://snaplabs.tech).

---

## 🛠️ Tech Stack & Architecture

- **Core Framework:** [Astro 5](https://docs.astro.build) (Static Site Generation + Server Endpoints via `@astrojs/node` in standalone mode)
- **Interactive Islands:** [React 19](https://react.dev) via `@astrojs/react`
  - In-tree WebGL Phosphor CRT Telemetry Terminal ([`CrtTerminal.tsx`](./src/components/CrtTerminal.tsx))
  - Scroll-linked kinetic tagline reveal ([`TaglineReveal.tsx`](./src/components/TaglineReveal.tsx))
  - Grounded AI Assistant Island with Turnstile bot barrier ([`ChatWidget.tsx`](./src/components/ChatWidget.tsx), [`Turnstile.tsx`](./src/components/Turnstile.tsx))
- **AI Chatbot Architecture:**
  - **Level 1 Decision Guardrail:** Single forward-pass classification using `/v1/systemone` with `clef-flash` ([`decision.ts`](./src/lib/chat/decision.ts)). Evaluates domain scope and prompt threats without autoregressive token generation.
  - **Level 2 Grounded Answer Model:** Native progressive Server-Sent Events (SSE) streaming ([`answer.ts`](./src/lib/chat/answer.ts)) answering strictly from project markdown knowledge base without external AI SDK dependencies.
  - **Bot Mitigation Barrier:** Cloudflare Turnstile verification gate unlocking interaction only after session validation, with 30-minute token caching for seamless multi-turn conversations.
  - **Provider Rate Throttler:** In-flight token bucket queue capping traffic at 30 RPM, streaming live queue notices to clients during burst traffic without connection drops.
- **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- **Component Variants:** [`class-variance-authority` (cva)](https://cva.style) + [`clsx`](https://github.com/lukeed/clsx)
- **Typography:**
  - Display/Headings: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (Editorial Serif)
  - Interface/Body: [Geist](https://fonts.google.com/specimen/Geist) (Geometric Sans)
  - Telemetry/Metadata: [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) (Monospace)
- **Static Analysis & Guardrails:** `@astrojs/check` + TypeScript + GitHub Actions CI

---

## 📂 Project Structure

```text
snaplabs.tech/
├── .github/
│   └── workflows/
│       └── ci.yml            # Automated typecheck & build CI pipeline
├── docs/
│   ├── adr/                  # Architecture Decision Records
│   │   ├── 0001-react-and-crt-telemetry-island.md
│   │   ├── 0002-system-one-decision-guardrail.md
│   │   ├── 0003-turnstile-bot-mitigation-and-rate-throttler.md
│   │   └── 0004-node-adapter-openship-deployment.md
│   └── agents/               # Linear, triage labels, and domain skill configs
├── public/
│   ├── favicon.svg
│   └── team/                 # Member avatars (Nikhil, Prem, Sree Teja)
├── src/
│   ├── components/
│   │   ├── ChatWidget.tsx    # Multi-turn progressive SSE chat assistant
│   │   ├── CrtTerminal.tsx   # Pure WebGL CRT phosphor telemetry island
│   │   ├── ProjectCard.astro # Variant-driven project card (Featured & Grid)
│   │   ├── TaglineReveal.tsx # Scroll-linked kinetic typography reveal
│   │   └── Turnstile.tsx     # Cloudflare Turnstile client verification component
│   ├── content/
│   │   └── projects/         # Markdown content collections for lab projects
│   │       ├── family-vault.md
│   │       ├── rera-sentinel.md
│   │       └── tv-show-tracker.md
│   ├── layouts/
│   │   └── Layout.astro      # Main glassmorphic layout, fonts, header, footer & chat widget
│   ├── lib/
│   │   └── chat/             # Server-side chatbot engine & pipeline
│   │       ├── answer.ts     # Level 2 grounded answer streaming
│   │       ├── decision.ts   # Level 1 System One decision guardrail client
│   │       ├── guardrail.ts  # Fallback & combined guardrail dispatch
│   │       ├── pipeline.ts   # SSE response streaming pipeline & safety checks
│   │       ├── prompts.ts    # System prompts & canned responses
│   │       ├── provider.ts   # Multi-format provider streaming (OpenAI / Anthropic)
│   │       ├── ratelimit.ts  # In-flight 30 RPM token-bucket queue
│   │       └── turnstile.ts  # Server-side Turnstile verification & session cache
│   ├── pages/
│   │   ├── api/
│   │   │   └── chat.ts       # POST /api/chat SSE endpoint
│   │   └── index.astro       # Editorial homepage with telemetry & team sections
│   ├── styles/
│   │   └── global.css        # Tailwind v4 import & custom design tokens
│   └── content.config.ts     # Zod schema definitions for Content Layer
├── .env.example              # Environment variables template for Chat & Turnstile
├── AGENTS.md                 # Agent instructions & repo conventions
├── DESIGN.md                 # Design system specifications & component guidelines
├── GLOSSARY.md               # Domain terminology and vocabulary definitions
├── astro.config.mjs          # Astro & Vite plugin configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `^22.23.4` or higher
- npm (or pnpm / bun)

### Installation

```bash
# Clone the repository
git clone https://github.com/MugguruMonagallu/snaplabs.tech.git
cd snaplabs.tech

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
```

### Environment Configuration

Configure `.env` for the optional AI chat assistant and Turnstile bot protection:

```bash
# Level 1 Decision Guardrail (/v1/systemone API with clef-flash)
CHAT_DECISION_API_BASE_URL=https://api.experientiallabs.ai/v1/systemone
CHAT_DECISION_API_KEY=your_decision_api_key
CHAT_DECISION_MODEL=clef-flash

# Level 2 Grounded Answer Model
CHAT_API_BASE_URL=https://integrate.api.nvidia.com/v1
CHAT_API_FORMAT=openai
CHAT_API_KEY=your_chat_api_key
CHAT_ANSWER_MODEL=meta/llama-3.1-70b-instruct

# Cloudflare Turnstile Bot Mitigation (Optional in dev; bypassed if omitted)
TURNSTILE_SITE_KEY=0x4AAAAAAA...
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

*(If `TURNSTILE_SECRET_KEY` is not set, Turnstile verification is automatically bypassed for local development).*

### Development

```bash
# Start Astro dev server
npm run dev

# Or start in background mode (per repo conventions)
npx astro dev --background
```

Server will run at `http://localhost:4321`.

### Typecheck & Build

```bash
# Run Astro template & TypeScript diagnostics
npm run check

# Run full production build (runs check + astro build)
npm run build

# Preview production build locally
npm run preview
```

---

## 📝 Adding New Projects

Projects are managed via Astro's Content Layer in `src/content/projects/*.md`.

To add a new project, create a markdown file with the following frontmatter:

```markdown
---
title: "Project Name"
category: "DOMAIN CATEGORY"
tagline: "Short one-line value proposition"
description: "Detailed description of the problem solved and core capabilities."
status: "live" # 'live' | 'beta' | 'building' | 'concept'
url: "https://example.com" # optional
repoUrl: "https://github.com/..." # optional
tags: ["Next.js", "Leaflet", "Turf.js"]
featured: false # true for split-hero layout
order: 4
icon: "⚡"
---

Optional extended markdown notes and architecture details.
```

---

## 👥 The Builders

SnapLabs is built collaboratively by three friends:

- **Nikhil Malisetty** — *Lead Systems & Frontend Architect*
- **Prem Swaroop** — *Spatial Systems & Product Engineer*
- **Sree Teja Gunda** — *Fullstack & Mobile Engineer*

---

## 📜 License

Licensed under the [MIT License](LICENSE).
