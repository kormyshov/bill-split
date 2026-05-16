import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { TelegramShareButton } from "react-share";

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlDialog from '@shoelace-style/shoelace/dist/react/dialog';
import SlInput from '@shoelace-style/shoelace/dist/react/input';

import { GroupListContext } from '../../app/App';
import { GroupUpdateFlagContext } from '../../app/App';
import { ExpenseListContext } from '../../app/App';
import { MemberListContext } from '../../app/App';
import { TGroup } from '../../entities/types/group/group';
import { TUser } from '../../entities/types/user/user';
import { changeGroupName, leaveGroup } from '../../entities/upload/groups';

import { GRADIENTS } from '../../entities/data/gradients.ts';
import { CURRENCIES } from '../../entities/data/currencies.ts';


export default function GroupSetting() {

  const { groupId } = useParams();
  const { groupList } = useContext(GroupListContext);
  const group: TGroup = groupList.getItemById(Number(groupId)) as TGroup;

  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  const [groupName, setGroupName] = useState(group.getName());
  const [dialogGroupName, setDialogGroupName] = useState(group.getName());

  const { expenseList } = useContext(ExpenseListContext);

  const { memberList } = useContext(MemberListContext);

  const not_zero_totals = Object
    .values(CURRENCIES).map((value) => {
      return expenseList.getItems().filter(e => e.getCurrencySymbol() === value).reduce((sum, e) => sum + e.getDebtAmount(), 0)
    })
    .filter(amount => amount !== 0);

  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSaveGroupName = (groupName: string) => {
    changeGroupName(Number(groupId), groupName, group.getCreatedAt(), group.getCreatedBy());
    setDialogOpen(false);
    setGroupName(groupName);
    setGroupUpdateFlag(true);
  }

  const handleOpenDialog = () => {
    setDialogGroupName(groupName);
    setDialogOpen(true)
  }

  const handleLeaveGroup = () => {
    leaveGroup(Number(groupId));
    setGroupUpdateFlag(true);
    navigate('/');
  }

  return (
    <>
      <div style={{ background: GRADIENTS[group.getId() % 15], width: '100%', height: '10rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/groups/' + groupId)} />
      
      <h2 style={{ marginBottom: '0px' }}>
        {groupName}
        <SlIconButton name="pencil" label="Edit" style={{ fontSize: '1rem' }} onClick={() => handleOpenDialog()} />
      </h2>

      <SlDialog label="Edit group name" open={dialogOpen} onSlAfterHide={() => setDialogOpen(false)}>
        <SlInput
          value={dialogGroupName}
          onSlInput={(e)=>setDialogGroupName((e.target as HTMLInputElement).value)}
          autoFocus
        />
        <SlButton slot="footer" variant="neutral" onClick={() => setDialogOpen(false)}>
          Cancel
        </SlButton>
        <SlButton slot="footer" variant="success" onClick={() => handleSaveGroupName(dialogGroupName)}>
          Save
        </SlButton>
      </SlDialog>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        <TelegramShareButton
          url={"https://t.me/mrBillSplitBot/connect?startapp=" + group.getToken()}
          title=""
          style={{ width: '100%' }}
        >
          <SlButton variant="primary" style={{ width: '100%' }}>
            Invite members via Telegram
          </SlButton>
        </TelegramShareButton>

        <h3>
          Group members
        </h3>
        <ul>
          { memberList.getItems().map((member: TUser) => (
              <li key={member.getTelegramId()}>
                {member.getFirstName()} {member.getLastName()}
              </li>
            ))
          }
        </ul>

        <SlButton 
          variant="danger" 
          style={{ marginTop: '2rem', width: '100%' }} 
          onClick={() => handleLeaveGroup()} 
          outline
          {...(not_zero_totals.length > 0 ? { disabled: true } : { disabled: false })}
        >
          Leave group
        </SlButton>
        <span
          {...(not_zero_totals.length > 0 ? { style: { display: 'block', fontSize: '0.8rem' } } : { style: { display: 'none' } })}
        >
          You cannot leave the group while you have unsettled balances.
        </span>
      </div>
    </>
  );
}
