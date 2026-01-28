import React from 'react';
import { useState, useEffect } from 'react';

import SlInput from '@shoelace-style/shoelace/dist/react/input';
import SlOption from '@shoelace-style/shoelace/dist/react/option';
import SlSelect from '@shoelace-style/shoelace/dist/react/select';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlIcon from '@shoelace-style/shoelace/dist/react/icon';

import { TUser } from '../entities/types/user/user';


export default function CheckPosition(props: any) {

  const index = props.index;

  const [debtAmount, setDebtAmount] = useState(props.amount || 0);
  const [debtMemberId, setDebtMemberId] = useState(props.memberId || -1);

  useEffect(() => {
    setDebtAmount(props.amount);
    setDebtMemberId(props.memberId);
  }, [props.amount, props.memberId]);

  const memberOptions = props.groupMembers.getItems().map((member: TUser) =>
      <SlOption
        value={member.getId().toString()}
        {...(member.getId() === debtMemberId ? { selected: true } : { selected: false })}
      >
        {member.getFirstName()} {member.getLastName()}
      </SlOption>
  )

  const handleDebtAmountChange = (e: any) => {
    setDebtAmount(Number(e.target.value));
    props.handleDebtAmountChange(index, Number(e.target.value));
  }

  const handleDebtMemberChange = (e: any) => {
    setDebtMemberId(Number(e.target.value));
    props.handleDebtMemberChange(index, Number(e.target.value));
  }

  return (
    <>
      <SlInput
        placeholder="Amount"
        type="number"
        min="0"
        value={debtAmount.toString()}
        onSlInput={(e)=>handleDebtAmountChange(e)}
        style={{ width: '25%', marginBottom: '1rem', display: 'inline-block' }}
      />
      <SlSelect
        value={debtMemberId.toString()}
        style={{ width: '55%', marginBottom: '1rem', display: 'inline-block' }}
        onSlChange={(e)=>handleDebtMemberChange(e)}
      >
        {memberOptions}
      </SlSelect>
      <SlButton 
        variant="danger" 
        style={{ width: '10%', marginBottom: '1rem', display: 'inline-block', marginLeft: '2rem' }}
        onClick={()=>props.handleDeletePosition(index)}
      >
        <SlIcon name="trash3"></SlIcon>
      </SlButton>
    </>
  );
}
