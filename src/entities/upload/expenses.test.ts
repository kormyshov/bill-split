import { deleteExpense, optimizePayments } from './expenses';

describe('expense mutations', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true } as Response));
  });

  test('deleteExpense returns the request promise', async () => {
    const response = await deleteExpense(42);
    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('optimizePayments returns the request promise', async () => {
    const response = await optimizePayments('5');
    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
