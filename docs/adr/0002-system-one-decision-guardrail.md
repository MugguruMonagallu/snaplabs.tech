# 0002. System One Decision Guardrail and Zero-Dependency Streaming

## Context
The SnapLabs chatbot was originally structured with an LLM-based Level 1 guardrail meant to instruct Claude Haiku to classify topics, sanitize user queries, and output JSON. When switched to NVIDIA NIM, it failed due to unroutable model IDs (`nemotron-3.5-content-safety` 404s) and schema incompatibilities with classification models (Nemotron Safety Guard outputting binary safety tags rather than topic JSON). Furthermore, the pipeline buffered all streamed tokens in memory to execute post-hoc regex filters, creating a perceived latency penalty without true progressive token streaming.

## Decision
1. Replace the generative LLM classifier in Level 1 with a System One decision model (`clef-flash` via `POST /v1/systemone`) configured through `CHAT_DECISION_API_BASE_URL` and `CHAT_DECISION_API_KEY`.
2. Retire prompt-rewriting logic. `clef-flash` evaluates both domain topic fit (`snaplabs_projects` vs `off_topic`) and adversarial threat probability (`jailbreak_or_override`) in a single forward pass without autoregressive token generation.
3. Pass the original prompt (enclosed in `<user_message>` delimiters) directly to the Level 2 answer model (`poolside/laguna-xs-2.1`) upon passing guardrail thresholds.
4. Maintain zero external SDK dependencies (avoiding Vercel AI SDK bloat) by leveraging native Web APIs (`fetch`, `ReadableStream`, `TextDecoder`) optimized for Cloudflare Workers edge deployment.

## Consequences
- Single forward-pass classification latency drops to ~10–30ms without token generation costs.
- Deterministic output eliminates JSON parsing failures, markdown fence stripping, and format-induced false-positive refusals.
- Upstream `AbortSignal` cancellation stops provider token drain when clients disconnect.
