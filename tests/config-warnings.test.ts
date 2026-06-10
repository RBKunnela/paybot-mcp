/**
 * Tests for the boot-time API-key warning (src/config-warnings.ts).
 *
 * Behavior under test: warn (stderr) when PAYBOT_API_KEY is unset/empty,
 * stay silent when a key is configured, and never throw — booting must
 * always succeed regardless of configuration.
 */
import { describe, expect, test, vi } from 'vitest';
import { warnIfApiKeyMissing } from '../src/config-warnings.js';
import { createMcpServer } from '../src/server.js';

describe('warnIfApiKeyMissing', () => {
  test('[UNIT] warnIfApiKeyMissing — should warn once when no API key env var is set', () => {
    const warn = vi.fn();

    const warned = warnIfApiKeyMissing({}, warn);

    expect(warned).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[paybot-mcp] PAYBOT_API_KEY is not set — tool calls will fail with 401. ' +
        'See README → Get your API key.'
    );
  });

  test('[UNIT] warnIfApiKeyMissing — should warn when PAYBOT_API_KEY is empty or whitespace', () => {
    const warn = vi.fn();

    expect(warnIfApiKeyMissing({ PAYBOT_API_KEY: '' }, warn)).toBe(true);
    expect(warnIfApiKeyMissing({ PAYBOT_API_KEY: '   ' }, warn)).toBe(true);
    // Mirrors server.ts `??` semantics: an empty PAYBOT_API_KEY does NOT fall
    // through to API_KEY, so this combination still fails at tool-call time.
    expect(warnIfApiKeyMissing({ PAYBOT_API_KEY: '', API_KEY: 'pb_test_fallback' }, warn)).toBe(
      true
    );
    expect(warn).toHaveBeenCalledTimes(3);
  });

  test('[UNIT] warnIfApiKeyMissing — should stay silent when PAYBOT_API_KEY is set', () => {
    const warn = vi.fn();

    const warned = warnIfApiKeyMissing({ PAYBOT_API_KEY: 'pb_test_dummy_key' }, warn);

    expect(warned).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  test('[UNIT] warnIfApiKeyMissing — should stay silent when only the API_KEY fallback is set', () => {
    const warn = vi.fn();

    const warned = warnIfApiKeyMissing({ API_KEY: 'pb_test_dummy_key' }, warn);

    expect(warned).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  test('[UNIT] warnIfApiKeyMissing — should never throw and boot should still succeed without a key', () => {
    // The warning path itself must not throw for any env shape.
    expect(() => warnIfApiKeyMissing({}, () => undefined)).not.toThrow();
    expect(() =>
      warnIfApiKeyMissing({ PAYBOT_API_KEY: undefined, API_KEY: undefined }, () => undefined)
    ).not.toThrow();

    // Boot must not crash: the server constructs fine with no key configured
    // (failure is deferred to the first tool call, by design).
    const prevPaybotKey = process.env.PAYBOT_API_KEY;
    const prevApiKey = process.env.API_KEY;
    delete process.env.PAYBOT_API_KEY;
    delete process.env.API_KEY;
    try {
      expect(() => createMcpServer()).not.toThrow();
    } finally {
      if (prevPaybotKey !== undefined) process.env.PAYBOT_API_KEY = prevPaybotKey;
      if (prevApiKey !== undefined) process.env.API_KEY = prevApiKey;
    }
  });
});
