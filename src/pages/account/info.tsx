import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { AccountContext } from '../../app/App.tsx';
import { AccountUpdateFlagContext } from '../../app/App.tsx';
import SlFormatDate from '@shoelace-style/shoelace/dist/react/format-date';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlBadge from '@shoelace-style/shoelace/dist/react/badge';



export default function AccountInfo() {

  const navigate = useNavigate();

  const { account } = useContext(AccountContext);
  const { setAccountUpdateFlag } = useContext(AccountUpdateFlagContext);

  return (
    <>

      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', height: '10rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <div>
            <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/')} />
          </div>
          <div style={{ float: 'left' }}>
            <h2 style={{ marginBottom: '0px' }}>{account.getFirstName()} {account.getLastName()}</h2>
            { account.isPremium() ?
              <SlBadge variant="neutral">Premium until&nbsp;<SlFormatDate month="long" day="numeric" year="numeric" date={account.getExpiredDate()}/></SlBadge>
              :
              <></>
            }
          </div>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
to do
      </div>
    </>
  );
}
