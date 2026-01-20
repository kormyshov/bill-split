import React, { useContext, useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { TelegramShareButton } from "react-share";

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlDialog from '@shoelace-style/shoelace/dist/react/dialog';
import SlInput from '@shoelace-style/shoelace/dist/react/input';

import { getCommand } from '../../entities/upload/common';

import { GroupListContext } from '../../app/App';
import { TGroup } from '../../entities/types/group/group';
import { TUser } from '../../entities/types/user/user';
import { TUserList } from '../../entities/types/user/user_list';
import { changeGroupName, leaveGroup } from '../../entities/upload/groups';


export default function GroupSetting() {

  const { groupId } = useParams();
  const { groupList } = useContext(GroupListContext);
  const group: TGroup = groupList.getItemById(Number(groupId)) as TGroup;

  const [groupName, setGroupName] = useState(group.getName());
  const [dialogGroupName, setDialogGroupName] = useState(group.getName());

  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSaveGroupName = (groupName: string) => {
    changeGroupName(Number(groupId), groupName, group.getCreatedAt(), group.getCreatedBy());
    setDialogOpen(false);
    setGroupName(groupName);
  }

  const handleOpenDialog = () => {
    setDialogGroupName(groupName);
    setDialogOpen(true)
  }

  const handleLeaveGroup = () => {
    leaveGroup(Number(groupId));
    navigate('/');
  }

  const [groupMembers, setGroupMembers] = useState(new TUserList());

  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch(getCommand("groups/get_member_list&group_id=" + groupId))

      const data = await response.json()
      console.log('Input member list:', data)
      data.group_members.forEach((item: any) => {
        const user = new TUser(
          item[0],
          item[1],
          item[2],
          item[3]
        );
        groupMembers.addItem(user);
      })
      setGroupMembers(new TUserList(groupMembers.getItems()));
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/groups/' + groupId)} />
      
      <h1 style={{ marginBottom: '0px' }}>
        {groupName}
        <SlIconButton name="pencil" label="Edit" style={{ fontSize: '1.5rem' }} onClick={() => handleOpenDialog()} />
      </h1>

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

      <TelegramShareButton
        url={"https://t.me/mrBillSplitBot"}
        title={"\nStart bot Mr. Bill Split and join to group \"" + groupName + "\" using this token: " + group.getToken() + "\n"}
        style={{ width: '100%' }}
      >
        <SlButton variant="primary" style={{ marginTop: '1rem', marginBottom: '1rem', width: '100%' }}>
          Invite members via Telegram
        </SlButton>
      </TelegramShareButton>

      <h3>
        Group members
      </h3>
      <ul>
        {groupMembers.getItems().map((member: TUser) => (
          <li key={member.getTelegramId()}>
            {member.getFirstName()} {member.getLastName()}
          </li>
        ))}
      </ul>

      <SlButton 
        variant="danger" 
        style={{ marginTop: '2rem', width: '100%' }} 
        onClick={() => handleLeaveGroup()} 
        outline
      >
        Leave group
      </SlButton>

    </>
  );
}
