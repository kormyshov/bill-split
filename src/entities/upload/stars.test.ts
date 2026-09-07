import { createInvoiceLink, PremiumPurchaseError } from './stars';

describe('Premium invoices', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('returns a normalized invoice link', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ invoice_link: 'https://t.me/$invoice' }),
    });

    await expect(createInvoiceLink(49, 10)).resolves.toBe('https://t.me/$invoice');
  });

  test('keeps compatibility with the legacy nested Telegram response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        invoice_link: JSON.stringify({ ok: true, result: 'https://t.me/$legacy' }),
      }),
    });

    await expect(createInvoiceLink(99, 30)).resolves.toBe('https://t.me/$legacy');
  });

  test('exposes a backend error instead of failing silently', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Premium purchase is temporarily unavailable' }),
    });

    try {
      await createInvoiceLink(999, 365);
      throw new Error('Expected createInvoiceLink to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(PremiumPurchaseError);
      expect((error as PremiumPurchaseError).status).toBe(502);
      expect((error as Error).message).toBe('Premium purchase is temporarily unavailable');
    }
  });

  test('rejects a malformed successful response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ invoice_link: '{"ok":false}' }),
    });

    await expect(createInvoiceLink(49, 10)).rejects.toThrow('invalid invoice');
  });
});
