import { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlInput from '@shoelace-style/shoelace/dist/react/input';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';

import { joinToGroup } from '../entities/upload/groups.ts';
import { GroupListContext } from '../app/App.tsx';
import { GroupUpdateFlagContext } from '../app/App.tsx';


export default function Connect() {

  const { token } = useParams();
  window.Telegram.WebApp.initDataUnsafe.start_param = "";

  const navigate = useNavigate();
  const [groupToken, setGroupToken] = useState(token ? token : "");

  const { groupList } = useContext(GroupListContext);
  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  const handleJoinToGroup = (groupToken: string) => {
    joinToGroup(groupToken);
    setGroupUpdateFlag(true);
    navigate('/');
  }

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/')} />


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
