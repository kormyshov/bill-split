import { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';

import { joinToGroup } from '../entities/upload/groups.ts';
import { GroupUpdateFlagContext } from '../app/App.tsx';
import { TelegramWebApp } from '../entities/utils/telegram.ts';


export default function Connect() {

  const { token } = useParams();
  TelegramWebApp().initDataUnsafe.start_param = "";

  const navigate = useNavigate();

  const { setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  useEffect(() => {
    const fetchData = async () => {
      joinToGroup(token ? token : "");
      setGroupUpdateFlag(true);
    }

    fetchData();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/')} />

          <h2>You are successfully joined</h2>
        </div>
      </div>
    </>
  );
}
