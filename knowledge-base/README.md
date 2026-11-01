# SnapLabs Chatbot Knowledge Base

This folder is the **only** context the website chatbot is allowed to use when answering questions. Every file here may be quoted to visitors of snaplabs.tech — treat each line as public, user-facing marketing copy.

## What belongs here

- `projects/<slug>.md` — one file per SnapLabs project.
- User-facing product facts only: what the project does, who it is for, the real-world problem it solves, current status (live / beta / building / concept), public product URL, availability, and plain-language FAQs.
- Use the vocabulary from `GLOSSARY.md` ("purpose-built project", "zero-knowledge storage", "spatial GIS engine", "developer trio").
- Attribution rule: projects are built by **the SnapLabs team** as a whole. Never write which individual built what.

## What must NEVER be written here

- Individual team-member names (Nikhil, Prem, Sree Teja, or any full names / usernames).
- Source code, file paths, folder structures, repository or `github.com` links.
- Tech-stack details the bot must not volunteer (frameworks, libraries, databases, auth providers, hosting providers, CI).
- Internal infrastructure, credentials, API keys, env vars, or anything from `.env`.
- Anything private about users, visitors, or the business.

If a fact is not in this folder, the chatbot answers: "That isn't public information — reach out at contact@snaplabs.tech".

## Format

Plain Markdown, one project per file under `projects/`. Short sections with `##` headings (e.g. `## What it does`, `## Who it's for`, `## Status`, `## FAQ`). No frontmatter needed — the file is loaded raw. Keep it concise; the whole folder is sent as context for small queries.
