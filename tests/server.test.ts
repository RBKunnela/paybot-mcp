import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock paybot-sdk before importing server
const mockPay = vi.fn();
const mockBalance = vi.fn();
const mockHistory = vi.fn();
const mockRegister = vi.fn();

vi.mock('paybot-sdk', () => ({
  PayBotClient: vi.fn().mockImplementation(() => ({
    pay: mockPay,
    balance: mockBalance,
    history: mockHistory,
    register: mockRegister,
    health: vi.fn(),
    setLimits: vi.fn(),
  })),
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
}));

// Capture tool registrations from McpServer
type ToolHandler = (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
const registeredTools = new Map<string, { description: string; schema: unknown; handler: ToolHandler }>();

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    tool: vi.fn((name: string, description: string, schema: unknown, handler: ToolHandler) => {
      registeredTools.set(name, { description, schema, handler });
    }),
    connect: vi.fn(),
  })),
}));

import { createMcpServer } from '../src/server.js';
import { PayBotClient, PayBotApiError } from 'paybot-sdk';

describe('createMcpServer', () => {
  beforeEach(() => {
    registeredTools.clear();
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

  it('should register exactly 4 tools', () => {
    createMcpServer();
    expect(registeredTools.size).toBe(4);
  });

  it('should register paybot_pay tool', () => {
    createMcpServer();
    expect(registeredTools.has('paybot_pay')).toBe(true);
  });

  it('should register paybot_balance tool', () => {
    createMcpServer();
    expect(registeredTools.has('paybot_balance')).toBe(true);
  });

  it('should register paybot_history tool', () => {
    createMcpServer();
    expect(registeredTools.has('paybot_history')).toBe(true);
  });

  it('should register paybot_register tool', () => {
    createMcpServer();
    expect(registeredTools.has('paybot_register')).toBe(true);
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

  it('should pass amount, recipient, and resource to client.pay()', async () => {
    mockPay.mockResolvedValueOnce({ success: true, txHash: '0x1', commissionRate: 0, commissionAmount: '0' });
    const tool = registeredTools.get('paybot_pay')!;
    await tool.handler({ amount: '1.00', recipient: '0xABCD', resource: 'https://test.com' }, {});

    expect(mockPay).toHaveBeenCalledWith({
      resource: 'https://test.com',
      amount: '1.00',
      payTo: '0xABCD',
      network: undefined,
    });
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

  it('should default trustLevel to 1', async () => {
    mockRegister.mockResolvedValueOnce({ success: true, botId: 'bot', trustLevel: 1 });
    const tool = registeredTools.get('paybot_register')!;
    await tool.handler({ botId: 'bot' }, {});
    expect(mockRegister).toHaveBeenCalledWith(1);
  });

  it('should pass custom trustLevel', async () => {
    mockRegister.mockResolvedValueOnce({ success: true, botId: 'bot', trustLevel: 3 });
    const tool = registeredTools.get('paybot_register')!;
    await tool.handler({ botId: 'bot', trustLevel: 3 }, {});
    expect(mockRegister).toHaveBeenCalledWith(3);
  });
});
