# 🎨 SnapLabs Design System Specification (`DESIGN.md`)

> **The visual language, typography, motion mechanics, and component guidelines for `snaplabs.tech`.**

This design system synthesizes **Emil Kowalski's Design Engineering philosophy** with **Apple's WWDC Fluid Interface principles**, presented in a high-contrast dark editorial aesthetic.

---

## 1. Core Principles

1. **Taste Over Commodity**: In an era where functional software is easily generated, visual discipline and craft are key differentiators.
2. **Unseen Details Compound**: Micro-interactions, precise border opacities, optical letter-spacing, and tactile button states combine into an interface that feels solid and alive.
3. **Tactile Responsiveness**: Interactive elements respond on `:active` with subtle scale feedback (`scale(0.97)` to `scale(0.99)`) using snappy custom curves (`200ms ease-out`).
4. **Purpose-Built Atmosphere**: Dark velvet obsidian foundation, warm typography, and subtle telemetry visuals that reflect engineering depth without visual clutter.

---

## 2. Color Palette & Tokens

### Base & Surfaces

| Token | CSS Value | Application |
| :--- | :--- | :--- |
| `Background Main` | `#09090b` | Viewport canvas (obsidian) |
| `Card Background` | `rgba(18, 18, 22, 0.70)` | Elevated bento cards with blur |
| `Glass Nav` | `rgba(9, 9, 11, 0.85)` | Sticky navigation with `blur(20px)` |
| `Card Border` | `rgba(255, 255, 255, 0.08)` | Default subtle card outline |
| `Card Border Hover` | `rgba(255, 255, 255, 0.18)` | Hover elevation outline |
| `Divider Subtle` | `rgba(255, 255, 255, 0.06)` | Section dividing rules |

### Accents & Status

| Role | Hex / RGB | Application |
| :--- | :--- | :--- |
| **Crimson Primary** | `#e11d48` (`rose-600`) | Primary CTA buttons, tag prefixes, key stats |
| **Crimson Glow** | `rgba(225, 29, 72, 0.25)` | Soft radial ambient glows, button shadows |
| **Live / Operational** | `#10b981` (`emerald-500`) | Production project status, system live pulse |
| **In Development** | `#f59e0b` (`amber-500`) | Active lab builds |
| **Beta** | `#38bdf8` (`sky-400`) | Feature testing phase |
| **Concept** | `#71717a` (`zinc-500`) | Exploratory architecture |

---

## 3. Typography Hierarchy

### Font Families

- **Display & Headings:** `Cormorant Garamond`, Georgia, serif
  - Classic high-contrast editorial serif with graceful italics and tall ascenders.
- **Interface & Body:** `Geist`, -apple-system, BlinkMacSystemFont, sans-serif
  - Geometric, highly legible screen sans for descriptions, buttons, and navigation.
- **Telemetry & Metadata:** `Geist Mono`, `ui-monospace`, `JetBrains Mono`, monospace
  - Crisp, fixed-width numerals, tags, and telemetry data.

### Typographic Patterns

- **Tag Lines (`.tag-line`):**
  - Font size: `0.75rem` (`12px`), uppercase, `tracking: 0.16em`, color: `#a1a1aa`.
  - Prefixed with a `1.5rem` horizontal crimson line (`background-color: var(--crimson)`).
- **Hero Title Rhythm:**
  - *Line 1:* `font-serif text-5xl font-light italic text-zinc-300` (e.g., "Independent")
  - *Line 2:* `font-serif text-8xl font-bold tracking-tight uppercase text-white` (e.g., "ENGINEERING")
  - *Line 3:* `font-serif text-7xl font-light tracking-widest text-zinc-600 uppercase` (e.g., "TRIO")
- **Section Titles:** `font-serif text-3xl sm:text-5xl font-normal text-white tracking-tight`
- **Body Text:** `text-sm text-zinc-400 leading-relaxed font-normal`

---

## 4. Motion & Micro-Interactions

### Timing & Easings

- **Snappy UI Interaction:** `cubic-bezier(0.23, 1, 0.32, 1)` (duration `200ms - 250ms`)
- **Press Feedback:** `transform: scale(0.97)` on buttons, `scale(0.99)` on cards.
- **Card Hover:** `transform: translateY(-2px)` + border opacity increase + subtle drop shadow.

### Ambient Keyframes

- **`.animate-spin-slow`:** `40s linear infinite` clockwise rotation on outer orbital ring.
- **`.animate-spin-reverse-slow`:** `55s linear infinite` counter-clockwise rotation on inner telemetry ring.
- **`.animate-pulse`:** `2s cubic-bezier(0.4, 0, 0.6, 1) infinite` on live status dots.

---

## 5. Component Inventory

### 1. Glass Navigation
- Fixed header with `backdrop-filter: blur(20px) saturate(180%)`.
- Brand logo: crimson dot + uppercase letter-spaced title.
- Right side: uppercase category links + mono `github ↗` badge.

### 2. Orbital Telemetry Visual
- Concentric SVG rings with alternating dash patterns (`stroke-dasharray="6, 8"`).
- Radial tick markers at 90-degree axes.
- Center glassmorphic badge with pulsing crimson radar beacon and `SNAPLABS EST. 2026`.

### 3. Metric Strip
- 3-column horizontal split card with thin vertical borders (`border-white/[0.08]`).
- Display numbers in light serif (`text-5xl font-light`), uppercase tracking-widest subtitles.

### 4. Project Showcase Cards
- **Featured Split Card:**
  - Left: Interactive telemetry monitor simulation with dark glass background, status indicators, and domain metrics.
  - Right: Domain category badge, serif project title, tagline, description, tech stack tags, and primary action buttons.
- **Bento Grid Cards (2-column):**
  - Top: Simulated technical spec header box showing security paradigm or API engine.
  - Middle: Serif title, tagline, description.
  - Bottom: Tech tags + `Launch ↗` or `In development` badge.

### 5. Technical Foundation Matrix (Bento Grid)
- 4-column cards categorizing engineering competencies.
- Crimson domain label, serif category title, explanation, and tag list.

### 6. Team Cards (3 Members)
- Clean avatar frame (`rounded-2xl` glass badge, subtle border, object-cover).
- Name in serif font, designation in crimson uppercase monospace.
- Direct bio paragraph + `github ↗` link.
- **Rule:** Never link specific projects to individuals; represent SnapLabs as an independent engineering trio.

### 7. Collaboration CTA Banner
- Elevated rounded-3xl container with ambient lighting.
- Serif headline + clear value proposition.
- Crimson primary button (`#e11d48`) with hover brightening (`#be123c`) and tactile click.

### 8. Interactive AI Assistant Island (`ChatWidget.tsx` & `Turnstile.tsx`)
- **Trigger Beacon:** Floating circular crimson badge (`#e11d48`, hover `#be123c`, active `scale-95`, pulse dot) anchored bottom-right.
- **Floating Panel:** Dark glass obsidian container (`rgba(14, 14, 18, 0.95)` with `backdrop-blur-2xl` and `border-white/[0.08]`). Features custom GPU entrance transition (`@keyframes chat-in` over `220ms` using `transform` and `opacity`).
- **Telemetry Header:** Top bar displaying uppercase monospace category metadata (`ASK ABOUT OUR PROJECTS`), live status indicator (`online`), and keyboard affordance (`esc`).
- **Bot Verification Gate:** Embedded Turnstile container rendered with a subtle dark theme. Displays animated spinner and session security indicator (`"Verifying session security…"`) while locking input and chips until verified.
- **Message Streams:**
  - *Assistant:* Obsidian translucent card (`bg-white/[0.04] border border-white/[0.06] text-zinc-300`). Supports real-time progressive SSE token streaming and post-hoc safety replacement.
  - *User:* Right-aligned crimson-tinted bubble (`bg-[#e11d48]/15 border border-[#e11d48]/30 text-rose-100`).
  - *Quick Question Chips:* Rounded pill buttons (`rounded-full bg-white/[0.04] border-white/10 hover:border-[#e11d48]/50 active:scale-95`) populated only after verification.
  - *Queue Notice:* Ambient amber indicator (`border-amber-500/20 bg-amber-500/5 text-amber-300/80`) alerting user when request is held in-flight during upstream rate throttle.
- **Action Bar:** Integrated input field (`bg-black/40 border-white/10 focus:border-[#e11d48]/60`) with uppercase tactile `SEND` button (`active:scale-95`).

---

## 6. Accessibility & Performance Guardrails

- **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, orbital rotations pause and transitions fall back to instant opacity fades.
- **High Contrast:** Text elements maintain a minimum contrast ratio of `7:1` against obsidian backgrounds.
- **Compositor Only:** Hover and active animations target exclusively `transform` and `opacity` to avoid GPU layout reflows.
