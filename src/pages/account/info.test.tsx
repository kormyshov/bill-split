import { fireEvent, render, screen } from '@testing-library/react';

import { AccountContext, AccountUpdateFlagContext } from '../../app/App';
import { TUser } from '../../entities/types/user/user';
import AccountInfo from './info';

const mockCreateInvoiceLink = jest.fn();

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
  paidPremium: jest.fn(),
}));

jest.mock('../../entities/utils/telegram', () => ({
  haptic: jest.fn(),
  TelegramWebApp: () => ({
    openInvoice: jest.fn(),
    showPopup: jest.fn(),
  }),
}));

jest.mock('@shoelace-style/shoelace/dist/react/icon', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <span data-icon={name} />,
}));

test('shows an actionable error when an invoice cannot be created', async () => {
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
