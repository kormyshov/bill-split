import { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { joinToGroup } from '../entities/upload/groups';
import { GroupUpdateFlagContext } from '../app/App';
import { haptic, TelegramWebApp } from '../entities/utils/telegram';
import { EmptyState, PrimaryButton, TopBar } from '../widgets/telegram-ui';

export default function Connect() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  useEffect(() => {
    TelegramWebApp().initDataUnsafe.start_param = '';
    joinToGroup(token || '');
    setGroupUpdateFlag(true);
    haptic('success');
  }, [setGroupUpdateFlag, token]);

  return (
    <main className="tg-page">
      <TopBar title="Bill Split" onBack={() => navigate('/')} />
      <div className="tg-page-content">
        <EmptyState icon="check" title="You joined the group" message="The group is now available on your Bill Split home screen." />
        <PrimaryButton onClick={() => navigate('/')}>View my groups</PrimaryButton>
      </div>
    </main>
  );
}
