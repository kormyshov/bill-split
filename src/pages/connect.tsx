import { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { joinToGroup } from '../entities/upload/groups.ts';
import { GroupUpdateFlagContext } from '../app/App.tsx';


export default function Connect() {

  const { token } = useParams();
  window.Telegram.WebApp.initDataUnsafe.start_param = "";

  const navigate = useNavigate();

  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  joinToGroup(token ? token : "");
  setGroupUpdateFlag(true);

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <h2>You are successfully joined</h2>
        </div>
      </div>
    </>
  );
}
