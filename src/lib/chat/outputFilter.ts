// Defense-in-depth: a deterministic deny-list applied to the final answer
// before it is streamed to the client. Catches model failures the guardrail
// might miss. On any hit the whole reply is replaced with a safe refusal.

import { REFUSAL_FILTERED } from './prompts';

// Individual names must never appear in bot output (attribution rule:
// projects are built by the SnapLabs team as a whole).
const NAME_PATTERN = /\b(nikhil|malisetty|prem|swaroop|sree\s*teja|gunda|sreeteja|akpremswaroop|nikhilmalisetty|gundasreeteja)\b/i;

// File-path-like or code artifacts.
const PATH_PATTERN = /\b[\w-]+\.(ts|tsx|js|jsx|py|json|env|yml|yaml|sql|sh|md)\b/i;

// URLs are allowed only for public product pages on *.snaplabs.tech.
const URL_PATTERN = /https?:\/\/[^\s)]+/gi;
const ALLOWED_URL = /^https:\/\/[\w.-]*snaplabs\.tech(\/[^\s)]*)?$/i;

// Terms that would leak internals / stack / attribution.
const TERM_PATTERN = /\b(source\s*code|repository|repo\b|github\.com|gitlab|database|db\b|sql|postgres|mongo|oracle|aws|azure|gcp|vercel|netlify|cloudflare|deployed on|hosted on|infra|infrastructure|tech\s*stack|stack|backend|serverless|lambda|kubernetes|docker|api key|secret|credential|password|token|\.env\b|internal\b|confidential|private\b)\b/i;

export function isAnswerSafe(answer: string): boolean {
  if (NAME_PATTERN.test(answer)) return false;
  if (PATH_PATTERN.test(answer)) return false;
  if (TERM_PATTERN.test(answer)) return false;
  const urls = answer.match(URL_PATTERN) ?? [];
  for (const url of urls) {
    if (!ALLOWED_URL.test(url)) return false;
  }
  return true;
}

export function filterAnswer(answer: string): string {
  return isAnswerSafe(answer) ? answer : REFUSAL_FILTERED;
}
