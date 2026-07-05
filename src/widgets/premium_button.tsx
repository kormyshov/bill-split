import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import SlButton from '@shoelace-style/shoelace/dist/react/button';

import { AccountContext } from '../app/App';
import SlIcon from '@shoelace-style/shoelace/dist/react/icon';


export default function PremiumButton(props: any) {

  const navigate = useNavigate();

  const { account } = useContext(AccountContext);

  return (
    <>
      { account.isPremium() || !props.isLimitExceeded ?
          <SlButton variant="primary" style={{ width: '100%' }} onClick={()=>{props.onCLick()}}>{props.title}</SlButton>
        :
          <SlButton variant="primary" style={{ width: '100%' }} onClick={()=>navigate('/account/info')}>
            <SlIcon name='coin' style={{ marginRight: '5px' }} />
            {props.title}
          </SlButton> 
      }
    </>
  );
}
