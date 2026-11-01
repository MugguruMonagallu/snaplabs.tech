# 0003. Cloudflare Turnstile Bot Mitigation and In-Flight Rate Throttler

## Context
Deploying an interactive chat interface backed by metered LLM APIs (`clef-flash` for decisions and `poolside/laguna-xs-2.1` for answers) exposes the application to automated scraping, credential/prompt-probing bots, and upstream rate limits (capped at 30 requests per minute). On Cloudflare Workers (`@astrojs/cloudflare`), writable filesystems and native SQLite addons are unavailable, meaning rate limiting and connection queuing must operate entirely in-memory or via edge primitives without breaking live HTTP/SSE connections.

## Decision
1. **Turnstile Bot Mitigation Flow**:
   - When the chat panel opens, display the initial welcome greeting accompanied by a session verification indicator.
   - Run Cloudflare Turnstile explicitly in a compact/managed container.
   - Keep quick-question chips and text input hidden/locked during verification.
   - Upon successful resolution (`callback(token)`), render the prompt *"What would you like to know?"*, reveal the quick question buttons, and unlock user input.
   - Pass the Turnstile token with the initial query to `POST /api/chat` and verify against `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
   - Automatically bypass Turnstile verification when `TURNSTILE_SECRET_KEY` is omitted in `.env` or in test environments.

2. **In-Flight 30 RPM Provider Throttler**:
   - Implement an in-memory token-bucket throttler configured for 30 requests per minute.
   - When burst traffic exhausts available tokens, hold the live SSE connection and emit an immediate status event:
     `{"type": "status", "text": "High traffic right now — your message is queued and will answer in a moment..."}`
   - Resume execution automatically once a token slot refills without dropping the connection or failing abruptly with a 429 status code.

## Consequences
- Automated scrapers and headless bots are blocked before invoking upstream model APIs.
- The user experiences transparent, friendly feedback during burst traffic rather than abrupt connection errors.
- Zero native SQLite C++ dependencies, ensuring clean compatibility with Cloudflare Workers.
