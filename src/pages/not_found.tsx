import { useNavigate } from 'react-router-dom';
import { EmptyState, PrimaryButton, TopBar } from '../widgets/telegram-ui';

export default function NotFound() {
  const navigate = useNavigate();
  return <main className="tg-page"><TopBar title="Bill Split" onBack={() => navigate('/')} /><div className="tg-page-content"><EmptyState title="Page not found" message="This screen may have moved or the link is no longer valid." /><PrimaryButton onClick={() => navigate('/')}>Back to groups</PrimaryButton></div></main>;
}
