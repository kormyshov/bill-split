import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AccountContext, AccountUpdateFlagContext } from '../../app/App';
import { TUser } from '../../entities/types/user/user';
import AccountInfo from './info';

const mockCreateInvoiceLink = jest.fn();
const mockOpenInvoice = jest.fn();
const mockShowPopup = jest.fn();
let mockStartParam: string | undefined;

jest.mock('react-router-dom', () => ({
  Route: () => null,
  Routes: () => null,
  useLocation: () => ({ pathname: '/account/info' }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('@shoelace-style/shoelace/dist/utilities/base-path.js', () => ({
  setBasePath: jest.fn(),
}));

jest.mock('../../entities/upload/stars', () => ({
  createInvoiceLink: (...args: unknown[]) => mockCreateInvoiceLink(...args),
}));

jest.mock('../../entities/utils/telegram', () => ({
  haptic: jest.fn(),
  TelegramWebApp: () => ({
    openInvoice: mockOpenInvoice,
    showPopup: mockShowPopup,
    initDataUnsafe: { start_param: mockStartParam },
  }),
}));

jest.mock('@shoelace-style/shoelace/dist/react/icon', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <span data-icon={name} />,
}));

test('shows an actionable error when an invoice cannot be created', async () => {
  mockStartParam = undefined;
  mockCreateInvoiceLink.mockRejectedValueOnce(new Error('Premium purchase is temporarily unavailable'));
  const account = new TUser(1, '123', 'Test', 'User', '1900-01-01', '');

  render(
    <AccountContext.Provider value={{ account, setAccount: jest.fn() }}>
      <AccountUpdateFlagContext.Provider value={{ accountUpdateFlag: false, setAccountUpdateFlag: jest.fn() }}>
        <AccountInfo />
      </AccountUpdateFlagContext.Provider>
    </AccountContext.Provider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /10 days/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Premium purchase is temporarily unavailable');
});

test('waits for the payment webhook to activate Premium after a paid invoice', async () => {
  mockStartParam = undefined;
  mockCreateInvoiceLink.mockResolvedValueOnce('https://t.me/$invoice');
  mockOpenInvoice.mockClear();
  mockShowPopup.mockClear();
  global.fetch = jest.fn();
  const setAccountUpdateFlag = jest.fn();
  const account = new TUser(1, '123', 'Test', 'User', '1900-01-01', '');

  render(
    <AccountContext.Provider value={{ account, setAccount: jest.fn() }}>
      <AccountUpdateFlagContext.Provider value={{ accountUpdateFlag: false, setAccountUpdateFlag }}>
        <AccountInfo />
      </AccountUpdateFlagContext.Provider>
    </AccountContext.Provider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /10 days/i }));
  await waitFor(() => expect(mockOpenInvoice).toHaveBeenCalled());
  expect(mockCreateInvoiceLink).toHaveBeenCalledWith(10);

  act(() => mockOpenInvoice.mock.calls[0][1]('paid'));
  expect(global.fetch).not.toHaveBeenCalled();
  expect(setAccountUpdateFlag).toHaveBeenCalledWith(true);
  expect(mockShowPopup).toHaveBeenCalledWith(expect.objectContaining({ title: 'Payment received' }));
});

test('shows the refundable 1 Star canary only for a canary launch', async () => {
  mockStartParam = undefined;
  const account = new TUser(1, '123', 'Test', 'User', '1900-01-01', '');
  const view = render(
    <AccountContext.Provider value={{ account, setAccount: jest.fn() }}>
      <AccountUpdateFlagContext.Provider value={{ accountUpdateFlag: false, setAccountUpdateFlag: jest.fn() }}>
        <AccountInfo />
      </AccountUpdateFlagContext.Provider>
    </AccountContext.Provider>,
  );
  expect(screen.queryByRole('button', { name: /Canary/i })).not.toBeInTheDocument();

  view.unmount();
  mockStartParam = 'canary';
  render(
    <AccountContext.Provider value={{ account, setAccount: jest.fn() }}>
      <AccountUpdateFlagContext.Provider value={{ accountUpdateFlag: false, setAccountUpdateFlag: jest.fn() }}>
        <AccountInfo />
      </AccountUpdateFlagContext.Provider>
    </AccountContext.Provider>,
  );
  expect(screen.getByRole('button', { name: /Canary/i })).toHaveTextContent('1');
});
