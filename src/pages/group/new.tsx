import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import SlInput from '@shoelace-style/shoelace/dist/react/input';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlDivider from '@shoelace-style/shoelace/dist/react/divider';

import { createGroup, joinToGroup } from '../../entities/upload/groups.ts';
import { GroupListContext } from '../../app/App.tsx';


export default function NewGroup() {

  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [groupToken, setGroupToken] = useState('');

  const { groupList } = useContext(GroupListContext);

  const handleCreateGroup = (groupName: string) => {
    createGroup(groupName);
    navigate('/');
  }

  const handleJoinToGroup = (groupToken: string) => {
    joinToGroup(groupToken);
    navigate('/');
  }

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/')} />
          <h2>Create new group</h2>
          <SlInput
            placeholder="Group name"
            value={groupName}
            onSlInput={(e)=>setGroupName((e.target as HTMLInputElement).value)}
            style={{ width: '100%', marginBottom: '1rem' }}
            autoFocus
          />
          <SlButton
            variant="success" 
            style={{ width: '100%', marginBottom: '1rem' }} 
            onClick={()=>handleCreateGroup(groupName)}
            {...(groupName.trim() === '' ? { disabled: true } : { disabled: false })}
          >
            Create
          </SlButton>

          <SlDivider style={{ width: '40%', float: 'left', marginTop: '2rem', borderWidth: '2px' }} />
          <h4 style={{ width: '20%', float: 'left', textAlign: 'center' }}>or</h4>
          <SlDivider style={{ width: '40%', float: 'right', marginTop: '2rem', borderWidth: '2px' }} />

          <h2 style={{ clear: 'both', marginTop: '5rem' }}>Join to existed group</h2>
          <SlInput
            placeholder="Group token"
            value={groupToken}
            onSlInput={(e)=>setGroupToken((e.target as HTMLInputElement).value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <SlButton 
            variant="success" 
            style={{ width: '100%', marginBottom: '1rem' }} 
            onClick={()=>handleJoinToGroup(groupToken)}
            {...(groupToken.trim() === '' || groupList.containsToken(groupToken) ? { disabled: true } : { disabled: false })}
          >
            Join
          </SlButton>
        </div>
      </div>
    </>
  );
}
