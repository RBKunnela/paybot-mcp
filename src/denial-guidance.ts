/**
 * @module denial-guidance
 *
 * Plain-language operator guidance for PayBot policy denials.
 *
 * When `paybot_pay` (or any policy-gated tool) is denied by core, the SDK
 * returns a machine `errorCode` (e.g. `DAILY_LIMIT_EXCEEDED`). On its own that
 * code is actionable only to someone who already knows the policy model. This
 * module maps each known policy code to a single plain-language sentence
 * telling the agent (and the human reading its log) what to do about it — so a
 * trust/limit/policy denial is actionable without opening core's logs.
 *
 * Scope: guidance is offered ONLY for codes that core treats as policy
 * decisions (the SDK's {@link POLICY_ERROR_CODES} set). Non-policy failures
 * (network, facilitator unreachable, signing) carry no guidance — fabricating
 * a "what to do" line for an infrastructure error would be misleading.
 *
 * Dependencies: none at runtime. The policy code set mirrors the SDK's
 *   `POLICY_ERROR_CODES`; see {@link POLICY_ERROR_CODES} note below.
 * Used by: src/server.ts (`paybot_pay` denial path).
 */

/**
 * Codes core treats as policy decisions (trust / AML / limit / envelope).
 *
 * This mirrors paybot-sdk's internal `POLICY_ERROR_CODES`. The SDK defines the
 * set in its `errors` module but does NOT re-export it from the package root
 * (paybot-sdk@0.4.0 only re-exports the error classes such as
 * `PayBotPolicyError`). Rather than reach into an un-exported submodule, the
 * MCP keeps a local copy of this small, stable set — decoupling the tool from
 * the SDK's internal module layout. Keep in sync if the SDK adds policy codes.
 */
export const POLICY_ERROR_CODES: ReadonlySet<string> = new Set([
  'TRUST_VIOLATION',
  'AML_BLOCKED',
  'DAILY_LIMIT_EXCEEDED',
  'SPENDING_ENVELOPE',
]);

/**
 * One-line, no-hype action for each known policy code. Keys MUST be a subset of
 * {@link POLICY_ERROR_CODES}; a code that is in the set but missing here falls
 * back to {@link GENERIC_POLICY_GUIDANCE} (still actionable, never silent).
 *
 * Company voice: direct, technical, no marketing language, ≤1 sentence.
 */
export const POLICY_GUIDANCE: Readonly<Record<string, string>> = Object.freeze({
  DAILY_LIMIT_EXCEEDED:
    'Raise the per-day limit with paybot_set_spending_limit, or wait for the daily window to reset.',
  TRUST_VIOLATION:
    'This bot\'s trust level is too low for this payment; raise its trust level or route the payment through a higher-trust bot.',
  AML_BLOCKED:
    'The recipient or amount was flagged by AML screening; verify the recipient address and amount, and escalate to an operator if it is expected.',
  SPENDING_ENVELOPE:
    'The payment falls outside this bot\'s allowed spending envelope; widen the envelope with paybot_set_spending_limit or use an in-envelope recipient/amount.',
});

/**
 * Fallback guidance for a policy code that core flags but this map does not yet
 * cover (e.g. a future SDK policy code). Keeps a denial actionable and never
 * silently omits the code — it just cannot offer a code-specific next step.
 */
export const GENERIC_POLICY_GUIDANCE =
  'This payment was blocked by a spending policy; review the bot\'s limits and trust level with paybot_balance, then adjust with paybot_set_spending_limit.';

/**
 * Resolve the plain-language guidance line for a denial error code.
 *
 * Returns guidance ONLY for policy codes (members of the SDK's
 * {@link POLICY_ERROR_CODES}). Known codes get their mapped sentence; a policy
 * code with no explicit mapping gets {@link GENERIC_POLICY_GUIDANCE}. Any code
 * that is not a policy code — and a missing/undefined code — returns `null`, so
 * the caller surfaces the SDK's own error text without fabricating advice.
 *
 * @param errorCode - Machine code from the SDK `PaymentResult.errorCode`, or
 *   undefined when the SDK did not provide one.
 * @returns A one-line guidance string for policy denials, otherwise `null`.
 *
 * @example
 * policyGuidance('DAILY_LIMIT_EXCEEDED')
 * // → 'Raise the per-day limit with paybot_set_spending_limit, ...'
 * policyGuidance('NETWORK_ERROR')
 * // → null  (non-policy failure: no guidance)
 */
export function policyGuidance(errorCode: string | undefined): string | null {
  if (!errorCode) {
    return null;
  }
  if (!POLICY_ERROR_CODES.has(errorCode)) {
    return null;
  }
  return POLICY_GUIDANCE[errorCode] ?? GENERIC_POLICY_GUIDANCE;
}

/**
 * Build the full denial response text for a failed `PaymentResult`.
 *
 * Surfaces the machine `errorCode` and the human `errorDetails` (when present)
 * in addition to the SDK's `error` message, then appends a plain-language
 * guidance line for policy denials. Mirrors the in-repo reference pattern in
 * `paybot_pool_allocate`, which already surfaces `errorCode` on the flagship
 * tool's behalf.
 *
 * Behaviour by case:
 * - Policy denial with a known code → message + `Code:` + `Details:` (if any) + guidance.
 * - Policy denial with an unmapped policy code → as above with generic guidance.
 * - Non-policy failure with a real SDK code → message + `Code:` (+ details), NO guidance.
 * - Non-policy failure with no code → message only (unchanged legacy text), NO invented code.
 *
 * @param result - The failed payment result (`success: false`). Only `error`,
 *   `errorCode`, and `errorDetails` are read.
 * @returns The multi-line denial text for the MCP tool response.
 *
 * @example
 * formatDenial({ error: 'Daily limit exceeded', errorCode: 'DAILY_LIMIT_EXCEEDED' })
 * // → 'Payment failed: Daily limit exceeded\nCode: DAILY_LIMIT_EXCEEDED\nGuidance: Raise the per-day limit ...'
 */
export function formatDenial(result: {
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
}): string {
  const lines: string[] = [`Payment failed: ${result.error ?? 'unknown error'}`];

  if (result.errorCode) {
    lines.push(`Code: ${result.errorCode}`);
  }

  if (result.errorDetails && Object.keys(result.errorDetails).length > 0) {
    lines.push(`Details: ${JSON.stringify(result.errorDetails)}`);
  }

  const guidance = policyGuidance(result.errorCode);
  if (guidance) {
    lines.push(`Guidance: ${guidance}`);
  }

  return lines.join('\n');
}
