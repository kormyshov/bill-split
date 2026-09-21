import { render, waitFor } from '@testing-library/react';

import GroupList from './list';

const mockNavigate = jest.fn();
let mockStartParam: string | undefined;

jest.mock('react-router-dom', () => ({
  Route: () => null,
  Routes: () => null,
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock('@shoelace-style/shoelace/dist/utilities/base-path.js', () => ({
  setBasePath: jest.fn(),
}));

jest.mock('../../entities/utils/telegram', () => ({
  haptic: jest.fn(),
  TelegramWebApp: () => ({
    initDataUnsafe: { start_param: mockStartParam },
  }),
}));

jest.mock('@shoelace-style/shoelace/dist/react/icon', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <span data-icon={name} />,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockStartParam = undefined;
});

test('opens Premium directly for a canary launch', async () => {
  mockStartParam = 'canary';
  render(<GroupList />);

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/account/info', { replace: true }));
});

test('keeps routing regular start parameters to group connection', async () => {
  mockStartParam = 'group-token';
  render(<GroupList />);

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/connect/group-token', { replace: true }));
});
