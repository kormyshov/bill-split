import { ReceiptScanError, scanReceipt } from './receipts';

describe('receipt scanning', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('sends a supported image as Base64 without keepalive', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        receipt: {
          total: 12.5,
          currency: 'EUR',
          items: [{ name: 'Coffee', price: 12.5 }],
        },
      }),
    });

    const receipt = await scanReceipt(new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' }));

    expect(receipt.items).toHaveLength(1);
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      image_base64: 'cmVjZWlwdA==',
      mime_type: 'image/jpeg',
    });
    expect(options.keepalive).toBeUndefined();
  });

  test('rejects unsupported images before sending a request', async () => {
    await expect(scanReceipt(new File(['receipt'], 'receipt.gif', { type: 'image/gif' }))).rejects.toThrow('JPEG or PNG');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('exposes backend errors and their status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Premium subscription is required' }),
    });

    try {
      await scanReceipt(new File(['receipt'], 'receipt.png', { type: 'image/png' }));
      throw new Error('Expected scanReceipt to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(ReceiptScanError);
      expect((error as ReceiptScanError).status).toBe(403);
      expect((error as Error).message).toBe('Premium subscription is required');
    }
  });
});
