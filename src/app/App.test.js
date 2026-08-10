import { render, screen } from '@testing-library/react';
import { PrimaryButton, TopBar } from '../widgets/telegram-ui';

jest.mock('@shoelace-style/shoelace/dist/react/icon', () => ({
  __esModule: true,
  default: ({ name }) => <span data-icon={name} />,
}));

test('renders Telegram-native navigation and actions', () => {
  render(<><TopBar title="Bill Split" /><PrimaryButton>New group</PrimaryButton></>);
  expect(screen.getByRole('heading', { name: 'Bill Split' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'New group' })).toBeInTheDocument();
});
