import { createInvoiceLink, PremiumPurchaseError } from './stars';

jest.mock('../utils/telegram', () => ({
  TelegramWebApp: () => ({ initData: 'signed-init-data' }),
}));

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

    await expect(createInvoiceLink(10)).resolves.toBe('https://t.me/$invoice');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://bill-split-invoice-892309313274.europe-west1.run.app/',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 10, init_data: 'signed-init-data' }),
      }),
    );
  });

  test('exposes a backend error instead of failing silently', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Premium purchase is temporarily unavailable' }),
    });

    try {
      await createInvoiceLink(365);
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

    await expect(createInvoiceLink(10)).rejects.toThrow('invalid invoice');
  });
});
