import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlTabPanel from '@shoelace-style/shoelace/dist/react/tab-panel';
import SlCheckbox from '@shoelace-style/shoelace/dist/react/checkbox';

import { TUser } from '../../entities/types/user/user';
import { createEquallyExpense } from '../../entities/upload/expenses.ts';
import { CURRENCIES } from '../../entities/data/currencies';


export default function EquallyExpenseTab(props: any) {

  const navigate = useNavigate();

  const [checkedList, setCheckedList] = useState<number[]>(props.groupMembers.getItems().map((member: TUser) => member.getId()));

  const handleChangeCheck = (checked: boolean, user_id: number) => {
    if (checked) {
      setCheckedList([...checkedList, user_id]);
    } else {
      setCheckedList(checkedList.filter((id) => id !== user_id));
    }
  }

  const checkList = props.groupMembers
    .getItems()
    .map((member: TUser) => (
      <SlCheckbox

        onSlChange={(e) => {handleChangeCheck((e.target as HTMLInputElement).checked, member.getId())}}
        style={{ display: 'block', marginBottom: '0.5rem' }}
      >
        {member.getFirstName()} {member.getLastName()}
      </SlCheckbox>
    ))

  const handleCreateEquallyExpense = () => {
    createEquallyExpense(
      props.groupId,
      props.expenseName, 
      props.expenseAmount, 
      props.expenseCurrency, 
      checkedList
    );
    navigate('/groups/' + props.groupId);
  }

  return (
    <>
      <SlTabPanel name="equally">
        <h3>Select members involved in expense:</h3>
        <ul>
          {checkList}
        </ul>
        <SlButton 
          variant="success" 
          style={{ width: '100%', marginTop: '1rem' }} 
          onClick={()=>{handleCreateEquallyExpense()}}
          {...(checkedList.length === 0 ? { disabled: true } : { disabled: false })}
        >
          Split by {(props.expenseAmount / checkedList.length).toFixed(2)} {CURRENCIES[props.expenseCurrency]}
        </SlButton>
      </SlTabPanel>
    </>
  );
}
