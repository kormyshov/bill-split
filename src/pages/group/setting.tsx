import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TelegramShareButton } from 'react-share';

import { ExpenseListContext, ExpenseUpdateFlagContext, GroupListContext, GroupUpdateFlagContext, MemberListContext, MemberUpdateFlagContext } from '../../app/App';
import { changeGroupName, leaveGroup } from '../../entities/upload/groups';
import { getCommand } from '../../entities/upload/common';
import { CURRENCIES } from '../../entities/data/currencies';
import { haptic } from '../../entities/utils/telegram';
import { TUserList } from '../../entities/types/user/user_list';
import { TUser } from '../../entities/types/user/user';
import { TExpenseList } from '../../entities/types/expense/expense_list';
import { TExpense } from '../../entities/types/expense/expense';
import { Avatar, GroupedList, Icon, ListRow, Modal, PrimaryButton, SkeletonRows, TopBar } from '../../widgets/telegram-ui';

export default function GroupSetting() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groupList } = useContext(GroupListContext);
  const group = groupList.getItemById(Number(groupId));
  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);
  const { expenseList, setExpenseList } = useContext(ExpenseListContext);
  const { expenseUpdateFlag, setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const { memberList, setMemberList } = useContext(MemberListContext);
  const { memberUpdateFlag, setMemberUpdateFlag } = useContext(MemberUpdateFlagContext);
  const [groupName, setGroupName] = useState(group?.getName() || '');
  const [dialogGroupName, setDialogGroupName] = useState(group?.getName() || '');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (group && !groupName) {
      setGroupName(group.getName());
      setDialogGroupName(group.getName());
    }
  }, [group, groupName]);

  useEffect(() => {
    if (!group) return;

    if (memberUpdateFlag !== group.getId()) {
      fetch(getCommand(`groups/get_member_list&group_id=${groupId}`)).then(response => response.json()).then(data => {
        const members = new TUserList();
        data.group_members.forEach((item: any) => members.addItem(new TUser(item[0], item[1], item[2], item[3], item[4], item[5])));
        setMemberList(members);
        setMemberUpdateFlag(group.getId());
      });
    }

    if (expenseUpdateFlag !== group.getId()) {
      fetch(getCommand(`groups/get_expense_list&group_id=${groupId}`)).then(response => response.json()).then(data => {
        const expenses = new TExpenseList();
        data.group_expenses.forEach((item: any) => expenses.addItem(new TExpense(item[0], item[1], item[2], item[3], item[4], item[5], item[6])));
        setExpenseList(expenses);
        setExpenseUpdateFlag(group.getId());
      });
    }
  }, [expenseUpdateFlag, group, groupId, memberUpdateFlag, setExpenseList, setExpenseUpdateFlag, setMemberList, setMemberUpdateFlag]);

  if (!group) return <main className="tg-page"><TopBar title="Group settings" onBack={() => navigate(`/groups/${groupId}`)} /></main>;

  const unsettled = Object.values(CURRENCIES).map(currency => expenseList.getItems().filter(expense => expense.getCurrencySymbol() === currency).reduce((sum, expense) => sum + expense.getDebtAmount(), 0)).some(amount => amount !== 0);
  const membersLoading = memberUpdateFlag !== group.getId();
  const balancesLoading = expenseUpdateFlag !== group.getId();

  const handleSaveGroupName = () => {
    if (!dialogGroupName.trim()) return;
    changeGroupName(Number(groupId), dialogGroupName.trim(), group.getCreatedAt(), group.getCreatedBy());
    setDialogOpen(false);
    setGroupName(dialogGroupName.trim());
    setGroupUpdateFlag(true);
    haptic('success');
  };

  const handleLeaveGroup = () => {
    if (unsettled || balancesLoading) return;
    leaveGroup(Number(groupId));
    setGroupUpdateFlag(true);
    haptic('warning');
    navigate('/');
  };

  return (
    <main className="tg-page">
      <TopBar title="Group settings" onBack={() => navigate(`/groups/${groupId}`)} />
      <div className="tg-page-content is-padded-top">
        <GroupedList>
          <ListRow avatar={<Avatar name={groupName} size="sm" />} title={groupName} trailing={<span className="tg-benefit-icon"><Icon name="edit" size={18} /></span>} onClick={() => { setDialogGroupName(groupName); setDialogOpen(true); }} />
          <TelegramShareButton url={`https://t.me/mrBillSplitBot/connect?startapp=${group.getToken()}`} title="" className="tg-share-row">
            <span className="tg-share-icon"><Icon name="share" size={19} /></span>
            <span className="tg-row-copy"><span className="tg-row-title">Invite members via Telegram</span><span className="tg-row-subtitle">Share a secure group link</span></span>
          </TelegramShareButton>
        </GroupedList>

        <h2 className="tg-section-title">Members</h2>
        {membersLoading ? <SkeletonRows count={3} /> : <GroupedList>
          {memberList.getItems().map(member => {
            const name = [member.getFirstName(), member.getLastName()].filter(Boolean).join(' ') || 'Member';
            return <ListRow key={member.getId()} avatar={<Avatar name={name} size="sm" />} title={name} />;
          })}
        </GroupedList>}

        <GroupedList className="tg-destructive-block" >
          <ListRow title="Leave group" subtitle={balancesLoading ? 'Checking balances…' : unsettled ? 'You cannot leave while you have unsettled balances.' : 'Remove this group from your account.'} trailing={unsettled || balancesLoading ? <span className="tg-lock"><Icon name="lock" size={17} /></span> : undefined} onClick={handleLeaveGroup} className="tg-destructive-row no-inset" />
        </GroupedList>
      </div>

      <Modal
        open={dialogOpen}
        title="Edit group name"
        onClose={() => setDialogOpen(false)}
        footer={<><PrimaryButton outline onClick={() => setDialogOpen(false)}>Cancel</PrimaryButton><PrimaryButton disabled={!dialogGroupName.trim()} onClick={handleSaveGroupName}>Save</PrimaryButton></>}
      >
        <label className="tg-modal-field-label" htmlFor="group-name">Group name</label>
        <input id="group-name" className="tg-text-input" value={dialogGroupName} onChange={event => setDialogGroupName(event.target.value)} autoFocus />
      </Modal>
    </main>
  );
}
