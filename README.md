# ⚡ SnapLabs Studio (`snaplabs.tech`)

> **Purpose-built software collective engineering single-purpose web platforms, GIS spatial intelligence, and autonomous developer workflows.**

[![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://svelte.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🧭 Overview

**SnapLabs** is an indie engineering studio founded by three developers. We build small, razor-sharp tools designed for exact real-world problems — avoiding enterprise bloat in favor of tactile performance, zero-knowledge privacy, and high-integrity architectures.

This repository powers the official website and portfolio at [snaplabs.tech](https://snaplabs.tech).

---

## 🛠️ Tech Stack & Architecture

- **Core Framework:** [Astro 5](https://astro.build) (Static Site Generation with Content Layer)
- **Styling Engine:** [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- **Component Variants:** [`class-variance-authority` (cva)](https://cva.style) + [`clsx`](https://github.com/lukeed/clsx)
- **Interactive Islands:** [Svelte 5](https://svelte.dev) via `@astrojs/svelte`
- **Typography:** [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (Editorial Display Serif) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Interface Sans)
- **Issue Tracking & CI:** Linear workspace integration via Model Context Protocol (MCP)

---

## 📂 Project Structure

```text
snaplabs.tech/
├── docs/
│   └── agents/               # Matt Pocock agent skill configs (Linear, Triage, Domain)
│       ├── domain.md
│       ├── issue-tracker.md
│       └── triage-labels.md
├── public/
│   ├── favicon.svg
│   └── team/                 # Member avatars (Nikhil, Prem, Sree Teja)
├── src/
│   ├── components/
│   │   └── ProjectCard.astro # Variant-driven project card (Featured & Grid)
│   ├── content/
│   │   └── projects/         # Markdown content collections for lab projects
│   │       ├── family-vault.md
│   │       ├── rera-sentinel.md
│   │       └── tv-show-tracker.md
│   ├── layouts/
│   │   └── Layout.astro      # Main glassmorphic layout, fonts, header & footer
│   ├── pages/
│   │   └── index.astro       # Editorial homepage with telemetry & team sections
│   ├── styles/
│   │   └── global.css        # Tailwind v4 import & custom design tokens
│   └── content.config.ts     # Zod schema definitions for Content Layer
├── AGENTS.md                 # Agent instructions & repo conventions
├── DESIGN.md                 # Design system specifications & component guidelines
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
```

### Development

```bash
# Start Astro dev server
npm run dev

# Or start in background mode (per repo conventions)
npx astro dev --background
```

Server will run at `http://localhost:4321`.

### Build & Verification

```bash
# Run typecheck and production build
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

## 👥 The Collective

SnapLabs is engineered by:

- **Nikhil Malisetty** — *Lead Systems & Frontend Architect*
- **Prem Swaroop** — *Spatial Systems & Product Engineer*
- **Sree Teja Gunda** — *Fullstack & Mobile Engineer*

---

## 📜 License

Licensed under the [MIT License](LICENSE).
