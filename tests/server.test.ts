import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock paybot-sdk before importing server
const mockPay = vi.fn();
const mockBalance = vi.fn();
const mockHistory = vi.fn();
const mockRegister = vi.fn();
const mockHealth = vi.fn();
const mockSetLimits = vi.fn();
const mockCommissionSummary = vi.fn();
const mockCommissionLedger = vi.fn();

// Pool mock surface — captured so individual tests can assert against it.
const mockPoolAddBot = vi.fn();
const mockPoolRemoveBot = vi.fn();
const mockPoolHasBot = vi.fn();
const mockPoolPayAs = vi.fn();
const mockPoolBotIds = vi.fn();
const mockPoolBotStats = vi.fn();
const mockPoolRemainingTreasury = vi.fn();
const mockPoolCtor = vi.fn();

vi.mock('paybot-sdk', () => ({
  PayBotClient: vi.fn(function PayBotClient(this: Record<string, unknown>) {
    this.pay = mockPay;
    this.balance = mockBalance;
    this.history = mockHistory;
    this.register = mockRegister;
    this.health = mockHealth;
    this.setLimits = mockSetLimits;
    this.commissionSummary = mockCommissionSummary;
    this.commissionLedger = mockCommissionLedger;
  }),
  PayBotClientPool: vi.fn(function PayBotClientPool(this: Record<string, unknown>, config: unknown) {
    mockPoolCtor(config);
    this.addBot = mockPoolAddBot;
    this.removeBot = mockPoolRemoveBot;
    this.hasBot = mockPoolHasBot;
    this.payAs = mockPoolPayAs;
    this.botIds = mockPoolBotIds;
    this.botStats = mockPoolBotStats;
    this.remainingTreasuryUsd = mockPoolRemainingTreasury;
    Object.defineProperty(this, 'size', {
      get: () => mockPoolBotIds().length,
    });
  }),
  PayBotApiError: class PayBotApiError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode: number) {
      super(message);
      this.name = 'PayBotApiError';
      this.code = code;
      this.statusCode = statusCode;
    }
  },
  // Public networks/tokens registry — pure, offline. The boundary test relies
  // on these returning ONLY public-registry data (no EURC mainnet address).
  getSupportedNetworks: () => [
    'eip155:8453',
    'eip155:84532',
    'eip155:10',
    'eip155:42161',
    'eip155:137',
  ],
  getNetwork: (caip2: string) => {
    const map: Record<string, { name: string; isTestnet: boolean; explorerUrl: string }> = {
      'eip155:8453': { name: 'Base', isTestnet: false, explorerUrl: 'https://basescan.org' },
      'eip155:84532': { name: 'Base Sepolia', isTestnet: true, explorerUrl: 'https://sepolia.basescan.org' },
      'eip155:10': { name: 'Optimism', isTestnet: false, explorerUrl: 'https://optimistic.etherscan.io' },
      'eip155:42161': { name: 'Arbitrum One', isTestnet: false, explorerUrl: 'https://arbiscan.io' },
      'eip155:137': { name: 'Polygon', isTestnet: false, explorerUrl: 'https://polygonscan.com' },
    };
    return map[caip2];
  },
  getSupportedTokens: () => ['USDC', 'EURC', 'DAI'],
  getToken: (symbol: string) => {
    const map: Record<string, { decimals: number; name: string }> = {
      USDC: { decimals: 6, name: 'USD Coin' },
      EURC: { decimals: 6, name: 'Euro Coin' },
      DAI: { decimals: 18, name: 'Dai Stablecoin' },
    };
    return map[symbol];
  },
  // Public registry address resolution. EURC is deployed ONLY on Base Sepolia
  // (testnet) in the public registry — its mainnet address is operator-private
  // and intentionally absent here.
  getTokenAddress: (symbol: string, network: string): string | undefined => {
    const deployments: Record<string, Record<string, string>> = {
      USDC: {
        'eip155:8453': '0xUSDC_BASE',
        'eip155:84532': '0xUSDC_BASE_SEPOLIA',
        'eip155:10': '0xUSDC_OP',
        'eip155:42161': '0xUSDC_ARB',
        'eip155:137': '0xUSDC_POLY',
      },
      EURC: {
        'eip155:84532': '0xEURC_BASE_SEPOLIA',
      },
      DAI: {
        'eip155:10': '0xDAI_OP',
        'eip155:42161': '0xDAI_ARB',
        'eip155:137': '0xDAI_POLY',
        'eip155:8453': '0xDAI_BASE',
      },
    };
    return deployments[symbol]?.[network];
  },
}));

// Capture tool registrations from McpServer
type ToolHandler = (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
const registeredTools = new Map<string, { description: string; schema: unknown; handler: ToolHandler }>();

// Capture the {name, version} the server was constructed with so we can assert
// the served version is sourced from package.json (no drift).
const mcpServerConstructorArgs: Array<{ name?: string; version?: string }> = [];

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn(function McpServer(this: Record<string, unknown>, info: { name?: string; version?: string }) {
    mcpServerConstructorArgs.push(info);
    this.tool = vi.fn((name: string, description: string, schema: unknown, handler: ToolHandler) => {
      registeredTools.set(name, { description, schema, handler });
    });
    this.connect = vi.fn();
  }),
}));

import { createRequire } from 'node:module';
import { createMcpServer } from '../src/server.js';
import { PayBotClient, PayBotApiError } from 'paybot-sdk';

// Independently read the canonical version from package.json so the test
// asserts against the real source of truth rather than a hardcoded literal.
const require = createRequire(import.meta.url);
const { version: PACKAGE_VERSION } = require('../package.json') as { version: string };

describe('createMcpServer', () => {
  beforeEach(() => {
    registeredTools.clear();
    mcpServerConstructorArgs.length = 0;
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test_key';
    process.env.PAYBOT_BOT_ID = 'test-bot';
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
    delete process.env.PAYBOT_BOT_ID;
    delete process.env.API_KEY;
    delete process.env.PAYBOT_FACILITATOR_URL;
    delete process.env.PAYBOT_WALLET_KEY;
  });

  it('should return an MCP server instance', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
  });

  it('should serve the version from package.json (no drift)', () => {
    createMcpServer();
    expect(mcpServerConstructorArgs).toHaveLength(1);
    expect(mcpServerConstructorArgs[0].name).toBe('paybot');
    expect(mcpServerConstructorArgs[0].version).toBe(PACKAGE_VERSION);
    // Guard against the previously-hardcoded stale literal regressing.
    expect(mcpServerConstructorArgs[0].version).not.toBe('0.1.0');
  });

  it('should register exactly 12 tools', () => {
    createMcpServer();
    expect(registeredTools.size).toBe(12);
  });

  it.each([
    'paybot_pay',
    'paybot_balance',
    'paybot_history',
    'paybot_register',
    'paybot_list_networks_and_tokens',
    'paybot_health_extended',
    'paybot_set_spending_limit',
    'paybot_commission_inspect',
    'paybot_pool_create',
    'paybot_pool_allocate',
    'paybot_pool_revoke',
    'paybot_pool_status',
  ])('should register %s tool', (toolName) => {
    createMcpServer();
    expect(registeredTools.has(toolName)).toBe(true);
  });
});

describe('getClient (via tool invocation)', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
    delete process.env.PAYBOT_BOT_ID;
    delete process.env.API_KEY;
    delete process.env.PAYBOT_FACILITATOR_URL;
    delete process.env.PAYBOT_WALLET_KEY;
  });

  it('should throw when no API key is set', async () => {
    delete process.env.PAYBOT_API_KEY;
    delete process.env.API_KEY;
    createMcpServer();
    const balance = registeredTools.get('paybot_balance')!;
    await expect(balance.handler({}, {})).rejects.toThrow(/API key/);
  });

  it('should accept API_KEY as fallback env var', async () => {
    delete process.env.PAYBOT_API_KEY;
    process.env.API_KEY = 'pb_fallback';
    mockBalance.mockResolvedValueOnce({
      botId: 'test-bot', trustLevel: 1, trustLevelName: 'Basic',
      dailySpentUsd: 0, dailyLimitUsd: 10, dailyRemainingUsd: 10,
      hourlyTransactions: 0, hourlyLimit: 10,
    });
    createMcpServer();
    const balance = registeredTools.get('paybot_balance')!;
    await balance.handler({}, {});
    expect(PayBotClient).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'pb_fallback' }));
  });

  it('should use PAYBOT_FACILITATOR_URL when set', async () => {
    process.env.PAYBOT_API_KEY = 'pb_test';
    process.env.PAYBOT_FACILITATOR_URL = 'https://custom.api.com';
    mockBalance.mockResolvedValueOnce({
      botId: 'test-bot', trustLevel: 1, trustLevelName: 'Basic',
      dailySpentUsd: 0, dailyLimitUsd: 10, dailyRemainingUsd: 10,
      hourlyTransactions: 0, hourlyLimit: 10,
    });
    createMcpServer();
    const balance = registeredTools.get('paybot_balance')!;
    await balance.handler({}, {});
    expect(PayBotClient).toHaveBeenCalledWith(expect.objectContaining({
      facilitatorUrl: 'https://custom.api.com',
    }));
  });

  it('should use custom botId from tool args over env', async () => {
    process.env.PAYBOT_API_KEY = 'pb_test';
    mockBalance.mockResolvedValueOnce({
      botId: 'custom-bot', trustLevel: 1, trustLevelName: 'Basic',
      dailySpentUsd: 0, dailyLimitUsd: 10, dailyRemainingUsd: 10,
      hourlyTransactions: 0, hourlyLimit: 10,
    });
    createMcpServer();
    const balance = registeredTools.get('paybot_balance')!;
    await balance.handler({ botId: 'custom-bot' }, {});
    expect(PayBotClient).toHaveBeenCalledWith(expect.objectContaining({ botId: 'custom-bot' }));
  });
});

describe('paybot_pay tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  it('should return success message with tx details', async () => {
    mockPay.mockResolvedValueOnce({
      success: true,
      txHash: '0xABC123',
      commissionRate: 0.025,
      commissionAmount: '1250',
      network: 'eip155:84532',
    });

    const tool = registeredTools.get('paybot_pay')!;
    const result = await tool.handler({
      amount: '0.05',
      recipient: '0x1234',
      resource: 'https://api.example.com',
    }, {}) as { content: Array<{ text: string }> };

    expect(result.content[0].text).toContain('Payment successful');
    expect(result.content[0].text).toContain('0xABC123');
  });

  it('should return error message on payment failure', async () => {
    mockPay.mockResolvedValueOnce({
      success: false,
      error: 'Trust violation',
    });

    const tool = registeredTools.get('paybot_pay')!;
    const result = await tool.handler({
      amount: '100.00',
      recipient: '0x1234',
      resource: 'https://api.example.com',
    }, {}) as { content: Array<{ text: string }>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Trust violation');
  });

  it('should pass amount, recipient, and resource to client.pay() (USDC default, no idempotency key)', async () => {
    mockPay.mockResolvedValueOnce({ success: true, txHash: '0x1', commissionRate: 0, commissionAmount: '0' });
    const tool = registeredTools.get('paybot_pay')!;
    await tool.handler({ amount: '1.00', recipient: '0xABCD', resource: 'https://test.com' }, {});

    // Regression: existing callers omitting token/idempotencyKey still forward
    // those as undefined (SDK defaults to USDC, non-idempotent).
    expect(mockPay).toHaveBeenCalledWith({
      resource: 'https://test.com',
      amount: '1.00',
      payTo: '0xABCD',
      network: undefined,
      token: undefined,
      idempotencyKey: undefined,
    });
  });

  it('should forward token and idempotencyKey when provided (EURC)', async () => {
    mockPay.mockResolvedValueOnce({ success: true, txHash: '0x2', commissionRate: 0, commissionAmount: '0', network: 'eip155:84532' });
    const tool = registeredTools.get('paybot_pay')!;
    const result = await tool.handler(
      { amount: '2.50', recipient: '0xEUR', resource: 'https://eur.com', network: 'eip155:84532', token: 'EURC', idempotencyKey: 'idem-1' },
      {}
    ) as { content: Array<{ text: string }> };

    expect(mockPay).toHaveBeenCalledWith({
      resource: 'https://eur.com',
      amount: '2.50',
      payTo: '0xEUR',
      network: 'eip155:84532',
      token: 'EURC',
      idempotencyKey: 'idem-1',
    });
    // Token symbol surfaced in the output, not hardcoded USDC.
    expect(result.content[0].text).toContain('EURC');
  });

  it('should surface the SDK failure (e.g. TOKEN_ADDRESS_NOT_CONFIGURED) without crashing', async () => {
    mockPay.mockResolvedValueOnce({ success: false, error: 'EURC mainnet address not configured', errorCode: 'TOKEN_ADDRESS_NOT_CONFIGURED' });
    const tool = registeredTools.get('paybot_pay')!;
    const result = await tool.handler(
      { amount: '5.00', recipient: '0xEUR', resource: 'https://eur.com', network: 'eip155:8453', token: 'EURC' },
      {}
    ) as { content: Array<{ text: string }>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not configured');
  });

  it('should build a network-correct explorer URL (Optimism, not hardcoded Base Sepolia)', async () => {
    mockPay.mockResolvedValueOnce({ success: true, txHash: '0xOPTX', commissionRate: 0, commissionAmount: '0', network: 'eip155:10' });
    const tool = registeredTools.get('paybot_pay')!;
    const result = await tool.handler(
      { amount: '1.00', recipient: '0xABCD', resource: 'https://test.com', network: 'eip155:10' },
      {}
    ) as { content: Array<{ text: string }> };

    expect(result.content[0].text).toContain('optimistic.etherscan.io/tx/0xOPTX');
    expect(result.content[0].text).not.toContain('sepolia.basescan.org');
  });
});

describe('paybot_balance tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  it('should return formatted balance info', async () => {
    mockBalance.mockResolvedValueOnce({
      botId: 'my-bot',
      trustLevel: 2,
      trustLevelName: 'Verified',
      dailySpentUsd: 5.5,
      dailyLimitUsd: 100,
      dailyRemainingUsd: 94.5,
      hourlyTransactions: 3,
      hourlyLimit: 50,
    });

    const tool = registeredTools.get('paybot_balance')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };

    expect(result.content[0].text).toContain('my-bot');
    expect(result.content[0].text).toContain('Verified');
    expect(result.content[0].text).toContain('$5.50');
    expect(result.content[0].text).toContain('$94.50');
  });
});

describe('paybot_history tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  it('should return formatted event list', async () => {
    mockHistory.mockResolvedValueOnce([
      { eventId: '1', timestamp: '2026-01-01T00:00:00Z', eventType: 'PAYMENT_SETTLED', action: 'Payment settled', details: {} },
      { eventId: '2', timestamp: '2026-01-01T01:00:00Z', eventType: 'PAYMENT_VERIFIED', action: 'Payment verified', details: {} },
    ]);

    const tool = registeredTools.get('paybot_history')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };

    expect(result.content[0].text).toContain('PAYMENT_SETTLED');
    expect(result.content[0].text).toContain('PAYMENT_VERIFIED');
  });

  it('should return "no history" when empty', async () => {
    mockHistory.mockResolvedValueOnce([]);

    const tool = registeredTools.get('paybot_history')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };

    expect(result.content[0].text).toContain('No payment history');
  });

  it('should pass custom limit to client.history()', async () => {
    mockHistory.mockResolvedValueOnce([]);
    const tool = registeredTools.get('paybot_history')!;
    await tool.handler({ limit: 5 }, {});
    expect(mockHistory).toHaveBeenCalledWith(5);
  });

  it('should default limit to 10', async () => {
    mockHistory.mockResolvedValueOnce([]);
    const tool = registeredTools.get('paybot_history')!;
    await tool.handler({}, {});
    expect(mockHistory).toHaveBeenCalledWith(10);
  });
});

describe('paybot_register tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  it('should return success message with trust level', async () => {
    mockRegister.mockResolvedValueOnce({ success: true, botId: 'new-bot', trustLevel: 1 });

    const tool = registeredTools.get('paybot_register')!;
    const result = await tool.handler({ botId: 'new-bot' }, {}) as { content: Array<{ text: string }> };

    expect(result.content[0].text).toContain('new-bot');
    expect(result.content[0].text).toContain('trust level 1');
  });

  it('should return error message on 409 (already registered)', async () => {
    const error = new PayBotApiError('Bot already registered', 'ALREADY_EXISTS', 409);
    mockRegister.mockRejectedValueOnce(error);

    const tool = registeredTools.get('paybot_register')!;
    const result = await tool.handler({ botId: 'existing-bot' }, {}) as { content: Array<{ text: string }>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('already registered');
  });

  it('should default trustLevel to 1 (no idempotency key)', async () => {
    mockRegister.mockResolvedValueOnce({ success: true, botId: 'bot', trustLevel: 1 });
    const tool = registeredTools.get('paybot_register')!;
    await tool.handler({ botId: 'bot' }, {});
    // Regression: existing no-key path forwards trustLevel + undefined key.
    expect(mockRegister).toHaveBeenCalledWith(1, undefined);
  });

  it('should pass custom trustLevel', async () => {
    mockRegister.mockResolvedValueOnce({ success: true, botId: 'bot', trustLevel: 3 });
    const tool = registeredTools.get('paybot_register')!;
    await tool.handler({ botId: 'bot', trustLevel: 3 }, {});
    expect(mockRegister).toHaveBeenCalledWith(3, undefined);
  });

  it('should forward idempotencyKey to client.register()', async () => {
    mockRegister.mockResolvedValueOnce({ success: true, botId: 'bot', trustLevel: 1 });
    const tool = registeredTools.get('paybot_register')!;
    await tool.handler({ botId: 'bot', idempotencyKey: 'reg-key-1' }, {});
    expect(mockRegister).toHaveBeenCalledWith(1, 'reg-key-1');
  });
});

describe('paybot_list_networks_and_tokens tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    createMcpServer();
  });

  it('should list all 5 networks with name/caip2/testnet/explorer', async () => {
    const tool = registeredTools.get('paybot_list_networks_and_tokens')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };
    const text = result.content[0].text;
    expect(text).toContain('Supported networks (5)');
    expect(text).toContain('Base (eip155:8453)');
    expect(text).toContain('Base Sepolia (eip155:84532) [testnet]');
    expect(text).toContain('Optimism (eip155:10)');
    expect(text).toContain('https://optimistic.etherscan.io');
  });

  it('should list USDC/EURC/DAI with decimals and public per-network deployment', async () => {
    const tool = registeredTools.get('paybot_list_networks_and_tokens')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };
    const text = result.content[0].text;
    expect(text).toContain('Supported tokens (3)');
    expect(text).toContain('USDC (USD Coin, 6 decimals)');
    expect(text).toContain('DAI (Dai Stablecoin, 18 decimals)');
    // EURC public registry deployment is Base Sepolia ONLY.
    expect(text).toMatch(/EURC[^\n]*eip155:84532/);
  });

  it('should require NO api key (works with no PAYBOT_API_KEY set)', async () => {
    delete process.env.PAYBOT_API_KEY;
    delete process.env.API_KEY;
    const tool = registeredTools.get('paybot_list_networks_and_tokens')!;
    // Must not throw the "requires an API key" error — it never calls getClient.
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };
    expect(result.content[0].text).toContain('Supported networks');
    expect(PayBotClient).not.toHaveBeenCalled();
  });

  it('[BOUNDARY] must NOT surface any EURC mainnet address or operator-private content', async () => {
    const tool = registeredTools.get('paybot_list_networks_and_tokens')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };
    const text = result.content[0].text.toLowerCase();
    // The known operator-private EURC mainnet address must never appear.
    expect(text).not.toContain('0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42');
    // No premium/regulatory markers.
    expect(text).not.toContain('mica');
    expect(text).not.toContain('override');
    // EURC must NOT advertise a mainnet (Base 8453) deployment — testnet only.
    expect(text).not.toMatch(/eurc[^\n]*eip155:8453(?![0-9])/);
  });
});

describe('paybot_health_extended tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  it('should return status/version/uptime/timestamp', async () => {
    mockHealth.mockResolvedValueOnce({ status: 'ok', version: '1.2.3', uptime: 42, timestamp: '2026-06-03T00:00:00Z' });
    const tool = registeredTools.get('paybot_health_extended')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };
    const text = result.content[0].text;
    expect(text).toContain('Status: ok');
    expect(text).toContain('Version: 1.2.3');
    expect(text).toContain('Uptime: 42s');
  });

  it('should pass through extra fields (relayer/gas/aml)', async () => {
    mockHealth.mockResolvedValueOnce({
      status: 'ok', version: '1.0.0', uptime: 1, timestamp: 't',
      relayer: 'up', gasGwei: 12, aml: { provider: 'stub' },
    });
    const tool = registeredTools.get('paybot_health_extended')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };
    const text = result.content[0].text;
    expect(text).toContain('relayer: up');
    expect(text).toContain('gasGwei: 12');
    expect(text).toContain('aml: {"provider":"stub"}');
  });

  it('should return typed error content when facilitator is unreachable', async () => {
    const err = new PayBotApiError('connection refused', 'NETWORK_ERROR', 503);
    mockHealth.mockRejectedValueOnce(err);
    const tool = registeredTools.get('paybot_health_extended')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });
});

describe('paybot_set_spending_limit tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  it('should set all four limit fields', async () => {
    mockSetLimits.mockResolvedValueOnce(undefined);
    const tool = registeredTools.get('paybot_set_spending_limit')!;
    const result = await tool.handler({
      maxTransactionUsd: 5,
      maxDailySpendUsd: 100,
      maxTransactionsPerHour: 10,
      allowedRecipients: ['0xAAA', '0xBBB'],
    }, {}) as { content: Array<{ text: string }> };

    expect(mockSetLimits).toHaveBeenCalledWith({
      maxTransactionUsd: 5,
      maxDailySpendUsd: 100,
      maxTransactionsPerHour: 10,
      allowedRecipients: ['0xAAA', '0xBBB'],
    });
    expect(result.content[0].text).toContain('Spending limits updated');
  });

  it('should accept a partial config (only maxDailySpendUsd)', async () => {
    mockSetLimits.mockResolvedValueOnce(undefined);
    const tool = registeredTools.get('paybot_set_spending_limit')!;
    await tool.handler({ maxDailySpendUsd: 50 }, {});
    expect(mockSetLimits).toHaveBeenCalledWith({ maxDailySpendUsd: 50 });
  });

  it('should reject an empty config without calling the SDK', async () => {
    const tool = registeredTools.get('paybot_set_spending_limit')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(mockSetLimits).not.toHaveBeenCalled();
  });
});

describe('paybot_commission_inspect tool', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  const summary = {
    totalEarned: '1000', pending: '200', forwarded: '700', deferred: '100',
    commissionRate: 0.025, entryCount: 3,
  };

  it('should return summary totals and rate', async () => {
    mockCommissionSummary.mockResolvedValueOnce(summary);
    mockCommissionLedger.mockResolvedValueOnce([]);
    const tool = registeredTools.get('paybot_commission_inspect')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }> };
    const text = result.content[0].text;
    expect(text).toContain('Rate: 2.50%');
    expect(text).toContain('Total earned: 1000');
    expect(mockCommissionLedger).toHaveBeenCalledWith(undefined);
  });

  it('should forward ledger filters (status/date/pagination)', async () => {
    mockCommissionSummary.mockResolvedValueOnce(summary);
    mockCommissionLedger.mockResolvedValueOnce([
      { id: 'e1', txHash: '0xT', grossAmount: '100', netAmount: '97', commissionAmount: '3', commissionRate: 0.03, status: 'pending', createdAt: '2026-06-01' },
    ]);
    const tool = registeredTools.get('paybot_commission_inspect')!;
    const result = await tool.handler({ status: 'pending', limit: 5, offset: 10 }, {}) as { content: Array<{ text: string }> };
    expect(mockCommissionLedger).toHaveBeenCalledWith({ status: 'pending', limit: 5, offset: 10 });
    expect(result.content[0].text).toContain('[pending]');
  });

  it('should report "no entries" for an empty ledger (not an error)', async () => {
    mockCommissionSummary.mockResolvedValueOnce(summary);
    mockCommissionLedger.mockResolvedValueOnce([]);
    const tool = registeredTools.get('paybot_commission_inspect')!;
    const result = await tool.handler({}, {}) as { content: Array<{ text: string }>; isError?: boolean };
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('no entries');
  });
});

describe('pool tools', () => {
  beforeEach(() => {
    registeredTools.clear();
    vi.clearAllMocks();
    process.env.PAYBOT_API_KEY = 'pb_test';
    // Sensible pool-mock defaults.
    mockPoolHasBot.mockReturnValue(false);
    mockPoolBotIds.mockReturnValue([]);
    mockPoolRemoveBot.mockReturnValue(true);
    mockPoolRemainingTreasury.mockReturnValue(null);
    createMcpServer();
  });

  afterEach(() => {
    delete process.env.PAYBOT_API_KEY;
  });

  it('paybot_pool_create — creates a pool with a shared treasury', async () => {
    const tool = registeredTools.get('paybot_pool_create')!;
    const result = await tool.handler({ poolId: 'p1', sharedDailyLimitUsd: 100 }, {}) as { content: Array<{ text: string }> };
    expect(mockPoolCtor).toHaveBeenCalledWith(expect.objectContaining({ sharedDailyLimitUsd: 100 }));
    expect(result.content[0].text).toContain('Pool "p1" created');
    expect(result.content[0].text).toContain('$100.00');
  });

  it('paybot_pool_create — rejects creating a pool with a duplicate id', async () => {
    const tool = registeredTools.get('paybot_pool_create')!;
    await tool.handler({ poolId: 'dup' }, {});
    const result = await tool.handler({ poolId: 'dup' }, {}) as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('already exists');
  });

  it('paybot_pool_create — errors without an api key', async () => {
    delete process.env.PAYBOT_API_KEY;
    delete process.env.API_KEY;
    const tool = registeredTools.get('paybot_pool_create')!;
    const result = await tool.handler({ poolId: 'p-nokey' }, {}) as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API key');
  });

  it('paybot_pool_allocate — adds a bot and pays as it, decrementing treasury', async () => {
    const create = registeredTools.get('paybot_pool_create')!;
    await create.handler({ poolId: 'pa', sharedDailyLimitUsd: 50 }, {});
    mockPoolPayAs.mockResolvedValueOnce({ success: true, txHash: '0xPOOLTX', network: 'eip155:84532' });

    const allocate = registeredTools.get('paybot_pool_allocate')!;
    const result = await allocate.handler({
      poolId: 'pa', botId: 'bot-a',
      pay: { amount: '5', recipient: '0xR', resource: 'https://x.com' },
    }, {}) as { content: Array<{ text: string }> };

    expect(mockPoolAddBot).toHaveBeenCalledWith(expect.objectContaining({ botId: 'bot-a' }));
    expect(mockPoolPayAs).toHaveBeenCalledWith('bot-a', expect.objectContaining({ amount: '5', payTo: '0xR' }));
    expect(result.content[0].text).toContain('0xPOOLTX');
  });

  it('paybot_pool_allocate — surfaces TREASURY_EXCEEDED as an error (no crash)', async () => {
    const create = registeredTools.get('paybot_pool_create')!;
    await create.handler({ poolId: 'pe', sharedDailyLimitUsd: 1 }, {});
    mockPoolPayAs.mockResolvedValueOnce({ success: false, errorCode: 'TREASURY_EXCEEDED', error: 'over budget' });

    const allocate = registeredTools.get('paybot_pool_allocate')!;
    const result = await allocate.handler({
      poolId: 'pe', botId: 'bot-b',
      pay: { amount: '100', recipient: '0xR', resource: 'https://x.com' },
    }, {}) as { content: Array<{ text: string }>; isError: boolean };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('TREASURY_EXCEEDED');
  });

  it('paybot_pool_allocate — errors when the pool does not exist', async () => {
    const allocate = registeredTools.get('paybot_pool_allocate')!;
    const result = await allocate.handler({ poolId: 'ghost', botId: 'b' }, {}) as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });

  it('paybot_pool_revoke — removes a bot', async () => {
    const create = registeredTools.get('paybot_pool_create')!;
    await create.handler({ poolId: 'pr' }, {});
    mockPoolRemoveBot.mockReturnValueOnce(true);

    const revoke = registeredTools.get('paybot_pool_revoke')!;
    const result = await revoke.handler({ poolId: 'pr', botId: 'bot-x' }, {}) as { content: Array<{ text: string }> };
    expect(mockPoolRemoveBot).toHaveBeenCalledWith('bot-x');
    expect(result.content[0].text).toContain('revoked');
  });

  it('paybot_pool_status — reports per-bot stats and remaining treasury', async () => {
    const create = registeredTools.get('paybot_pool_create')!;
    await create.handler({ poolId: 'ps', sharedDailyLimitUsd: 100 }, {});
    mockPoolBotIds.mockReturnValue(['bot-a', 'bot-b']);
    mockPoolRemainingTreasury.mockReturnValue(73.5);
    mockPoolBotStats.mockImplementation((id: string) =>
      id === 'bot-a' ? { dailySpentUsd: 20, dailyTxCount: 2 } : { dailySpentUsd: 6.5, dailyTxCount: 1 }
    );

    const status = registeredTools.get('paybot_pool_status')!;
    const result = await status.handler({ poolId: 'ps' }, {}) as { content: Array<{ text: string }> };
    const text = result.content[0].text;
    expect(text).toContain('Remaining treasury: $73.50');
    expect(text).toContain('bot-a: spent $20.00 today, 2 tx');
    expect(text).toContain('bot-b: spent $6.50 today, 1 tx');
  });

  it('paybot_pool_status — errors when the pool does not exist', async () => {
    const status = registeredTools.get('paybot_pool_status')!;
    const result = await status.handler({ poolId: 'nope' }, {}) as { content: Array<{ text: string }>; isError: boolean };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });
});
