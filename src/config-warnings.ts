/**
 * @module config-warnings
 *
 * Startup configuration warnings for the PayBot MCP server.
 *
 * The server intentionally boots with zero environment variables (MCP stdio
 * servers must complete the protocol handshake even when misconfigured), which
 * means a missing API key only surfaces as a 401 at the FIRST tool call. This
 * module makes that failure visible at boot instead, by emitting a one-line
 * warning to stderr — stdout is reserved for the MCP protocol stream.
 *
 * Dependencies: none (pure function over an env snapshot)
 * Used by: src/index.ts (stdio entry point, before transport connect)
 */

/**
 * Warn once at boot when no usable PayBot API key is configured.
 *
 * Mirrors the env resolution used by `getClient()` in server.ts — the
 * effective key is `PAYBOT_API_KEY ?? API_KEY` — so the warning fires exactly
 * when a later tool call would fail with an authentication error. It never
 * throws and never exits: booting must always succeed so the MCP client can
 * connect and read tool descriptions.
 *
 * @param env - Environment snapshot to inspect (defaults to `process.env`).
 * @param warn - Sink for the warning line (defaults to `console.error`, i.e.
 *   stderr — never stdout, which carries MCP protocol frames).
 * @returns `true` when a warning was emitted, `false` when a key is present.
 *
 * @example
 * warnIfApiKeyMissing();
 * // stderr: [paybot-mcp] PAYBOT_API_KEY is not set — tool calls will fail with 401. ...
 */
export function warnIfApiKeyMissing(
  env: NodeJS.ProcessEnv = process.env,
  warn: (message: string) => void = console.error
): boolean {
  // Same precedence as server.ts getClient(): an empty PAYBOT_API_KEY does
  // NOT fall through to API_KEY (`??` only skips undefined/null), so an
  // empty string here is a real misconfiguration worth warning about.
  const apiKey = env.PAYBOT_API_KEY ?? env.API_KEY;
  if (apiKey === undefined || apiKey.trim() === '') {
    warn(
      '[paybot-mcp] PAYBOT_API_KEY is not set — tool calls will fail with 401. ' +
        'See README → Get your API key.'
    );
    return true;
  }
  return false;
}
