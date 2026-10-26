# 0001. React 19 Migration and In-Tree WebGL CRT Telemetry Island

## Context
SnapLabs was initially configured with Astro and `@astrojs/svelte`, but contained zero Svelte components. The team wanted to incorporate interactive WebGL shaders and components inspired by ThreeUI to replace a generic rotating SVG hero visual with something that directly reflects coding, systems engineering, and technical craft.

## Decision
1. Migrated the Astro integration from Svelte to React 19 (`@astrojs/react`).
2. Extracted the Phosphor CRT Terminal renderer from `threeui` into an in-tree React component (`CrtTerminal.tsx`) rather than installing the entire 164-shader `@designcodeio/threeui` npm package.
3. Configured the CRT terminal to run simulated, domain-specific telemetry for SnapLabs' three core projects (RERA Sentinel, Family Vault, and TV Show Tracker) rendered with native crimson and green phosphor shaders.

## Consequences
- React components can be selectively hydrated with `client:only="react"` or `client:visible`.
- Zero bundle bloat: no multi-version Three.js dependencies (`three128`, `three165`) or iframe sandboxing overhead.
- The hero visual now communicates what the developer trio actually builds instead of displaying abstract geometric wireframes.
