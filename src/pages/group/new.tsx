import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createGroup, joinToGroup } from '../../entities/upload/groups';
import { GroupListContext, GroupUpdateFlagContext } from '../../app/App';
import { haptic } from '../../entities/utils/telegram';
import { GroupedList, PrimaryButton, TopBar } from '../../widgets/telegram-ui';

export default function NewGroup() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [groupToken, setGroupToken] = useState('');
  const { groupList } = useContext(GroupListContext);
  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    createGroup(groupName.trim());
    setGroupUpdateFlag(true);
    haptic('success');
    navigate('/');
  };

  const handleJoinGroup = () => {
    if (!groupToken.trim() || groupList.containsToken(groupToken.trim())) return;
    joinToGroup(groupToken.trim());
    setGroupUpdateFlag(true);
    haptic('success');
    navigate('/');
  };

  const tokenAlreadyUsed = Boolean(groupToken.trim()) && groupList.containsToken(groupToken.trim());

  return (
    <main className="tg-page">
      <TopBar title="Create / Join" onBack={() => navigate('/')} />
      <div className="tg-page-content is-padded-top">
        <h2 className="tg-section-title">Create a new group</h2>
        <GroupedList className="tg-simple-form-card">
          <p>Start a group and invite friends.</p>
          <div className="tg-action-field">
            <input className="tg-text-input" value={groupName} onChange={event => setGroupName(event.target.value)} placeholder="Group name" aria-label="Group name" autoFocus />
            <PrimaryButton onClick={handleCreateGroup} disabled={!groupName.trim()}>Create</PrimaryButton>
          </div>
        </GroupedList>

        <h2 className="tg-section-title">Join an existing group</h2>
        <GroupedList className="tg-simple-form-card">
          <p>Paste an invite link or group token.</p>
          <div className="tg-action-field">
            <input className="tg-text-input" value={groupToken} onChange={event => setGroupToken(event.target.value)} placeholder="Link or token" aria-label="Invite link or token" />
            <PrimaryButton onClick={handleJoinGroup} disabled={!groupToken.trim() || tokenAlreadyUsed}>Join</PrimaryButton>
          </div>
          {tokenAlreadyUsed && <span className="tg-field-error">You already belong to this group.</span>}
        </GroupedList>
      </div>
    </main>
  );
}
