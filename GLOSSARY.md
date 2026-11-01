# SnapLabs Domain Glossary

SnapLabs is an independent engineering project by three friends and developers who discuss tech and AI, spotting real-world problems and building purpose-built tools to solve them.

## Language

**Developer Trio**:
The three founding engineers (Nikhil, Prem, Sree Teja) building and maintaining SnapLabs projects directly.
_Avoid_: Agency, corporate studio, collective, boutique consultancy

**Purpose-Built Project**:
A standalone, focused software system engineered to solve one specific, tangible real-world problem without feature bloat.
_Avoid_: Enterprise solution, SaaS product, client deliverable

**Real-World Grounding**:
The principle that every SnapLabs system originates from a concrete personal or societal problem the team encountered.
_Avoid_: Speculative feature, hype-driven demo, throwaway hackathon app

**Telemetry Terminal**:
A WebGL-rendered visual monitor inspired by cathode-ray terminals, displaying simulated diagnostic logs and operational metrics of SnapLabs projects.
_Avoid_: Generic decorative animation, wireframe sphere, hero graphic

**Spatial GIS Engine**:
The geospatial geometry and regulatory calculation pipeline used by RERA Sentinel to compute statutory lake Full Tank Level (FTL) and stream buffers.
_Avoid_: Simple map viewer, real estate scraper

**Zero-Knowledge Storage**:
An architectural model where encryption keys are derived on the client device, guaranteeing that cloud infrastructure hosts never possess the keys to decrypt user files.
_Avoid_: Traditional cloud backup, standard database encryption

**Decision Guardrail**:
The pre-execution Level 1 classification layer powered by a System One decision model (`clef-flash`), calculating calibrated topic and threat probabilities in a single forward pass without autoregressive token generation or prompt rewriting.
_Avoid_: Prompt rewriting filter, generative classifier, safety wrapper

**Grounded Answer Model**:
The Level 2 streaming model generating product explanations exclusively from curated markdown knowledge-base context within untrusted delimiter tags, enforcing collective trio attribution.
_Avoid_: Unconstrained chatbot, synthetic persona

**Bot Mitigation Barrier**:
A client-side verification gate via Cloudflare Turnstile that must resolve successfully before the chat interface unlocks input, preventing automated scraping and LLM credit exhaustion.
_Avoid_: Intrusive image puzzle, captcha gatekeeper

**Provider Rate Throttler**:
An in-flight token-bucket queue capping traffic to the decision and answer models at 30 requests per minute, holding burst requests with real-time SSE queue notices rather than immediate rejection.
_Avoid_: Offline queue database, hard 429 cliff
