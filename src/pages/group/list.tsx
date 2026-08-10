import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { GroupListContext, GroupUpdateFlagContext, AccountContext, AccountUpdateFlagContext } from '../../app/App';
import { TelegramWebApp } from '../../entities/utils/telegram';
import PremiumButton from '../../widgets/premium_button';
import { Avatar, EmptyState, GroupedList, Icon, ListRow, SectionTitle, SkeletonRows, TopBar } from '../../widgets/telegram-ui';

export default function GroupList() {
  const navigate = useNavigate();
  const { groupList } = useContext(GroupListContext);
  const { groupUpdateFlag } = useContext(GroupUpdateFlagContext);
  const { account } = useContext(AccountContext);
  const { accountUpdateFlag } = useContext(AccountUpdateFlagContext);

  useEffect(() => {
    const param = TelegramWebApp().initDataUnsafe.start_param;
    if (param) navigate(`/connect/${param}`, { replace: true });
  }, [navigate]);

  const groups = groupList.getItems();
  const accountName = [account.getFirstName(), account.getLastName()].filter(Boolean).join(' ') || 'Account';

  return (
    <main className="tg-page">
      <TopBar
        title="Bill Split"
        right={
          <button className="tg-nav-button" type="button" onClick={() => navigate('/account/info')} aria-label="Account">
            {accountUpdateFlag ? <span className="tg-avatar tg-avatar-sm tg-avatar-blue" /> : <Avatar name={accountName} size="sm" />}
          </button>
        }
      />

      <div className="tg-page-content is-padded-top">
        <SectionTitle>Your groups</SectionTitle>
        {groupUpdateFlag ? <SkeletonRows count={3} /> : groups.length ? (
          <GroupedList>
            {groups.map(group => (
              <ListRow
                key={group.getId()}
                avatar={<Avatar name={group.getName()} />}
                title={group.getName()}
                subtitle={`${group.getCount()} ${group.getCount() === 1 ? 'member' : 'members'}`}
                onClick={() => navigate(`/groups/${group.getId()}`)}
                chevron
              />
            ))}
          </GroupedList>
        ) : (
          <EmptyState icon="users" title="No groups yet" message="Create your first group or join one with an invite link." />
        )}

        <div className="tg-sticky-action">
          <PremiumButton onCLick={() => navigate('/groups/new')} isLimitExceeded={groups.length > 9} title={<><Icon name="plus" size={19} /> New group</>} />
        </div>
      </div>
    </main>
  );
}
