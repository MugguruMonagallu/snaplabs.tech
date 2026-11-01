// Level 1 of the pipeline: System One Decision Guardrail.
// Gates incoming user messages using Cloudflare clef-flash via the /v1/systemone API.
// Classifies topic relevance and detects adversarial prompt injections in a single forward pass.
// Re-exports canonical guard types and delegates to decision.ts.

import { runDecisionGuardrail, type DecisionResult, type DecisionVerdict } from './decision';

export type GuardVerdict = DecisionVerdict;
export type GuardResult = DecisionResult;

export async function runGuardrail(
  userMessage: string,
  signal?: AbortSignal,
): Promise<GuardResult> {
  return runDecisionGuardrail(userMessage, signal);
}
