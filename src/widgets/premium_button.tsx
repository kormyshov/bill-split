import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { AccountContext } from '../app/App';
import { haptic } from '../entities/utils/telegram';
import { Icon, PrimaryButton } from './telegram-ui';

export default function PremiumButton(props: any) {
  const navigate = useNavigate();
  const { account } = useContext(AccountContext);
  const locked = !account.isPremium() && props.isLimitExceeded;

  const handleClick = () => {
    haptic('selection');
    if (locked) navigate('/account/info');
    else props.onCLick();
  };

  return (
    <PrimaryButton onClick={handleClick} className={props.className || ''}>
      {locked && <Icon name="star" size={17} />}
      {props.title}
    </PrimaryButton>
  );
}
