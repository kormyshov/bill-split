import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BalanceUpdateFlagContext, ExpenseUpdateFlagContext } from '../../app/App';
import { TUser } from '../../entities/types/user/user';
import { createEquallyExpense } from '../../entities/upload/expenses';
import { CURRENCIES } from '../../entities/data/currencies';
import { haptic } from '../../entities/utils/telegram';
import { Avatar, GroupedList, Icon, ListRow, PrimaryButton, personName } from '../telegram-ui';

export default function EquallyExpenseTab(props: any) {
  const navigate = useNavigate();
  const { setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const { setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);
  const members: TUser[] = props.groupMembers.getItems();
  const [checkedList, setCheckedList] = useState<number[]>(() => members.map(member => member.getId()));

  useEffect(() => {
    if (!checkedList.length && members.length) setCheckedList(members.map(member => member.getId()));
  }, [checkedList.length, members]);

  const toggle = (userId: number) => {
    setCheckedList(current => current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]);
    haptic('selection');
  };

  const save = () => {
    createEquallyExpense(props.groupId, props.expenseName, props.expenseAmount, props.expenseCurrency, props.payerId, checkedList);
    setExpenseUpdateFlag(-1);
    setBalanceUpdateFlag(-1);
    haptic('success');
    navigate(`/groups/${props.groupId}`);
  };

  const share = checkedList.length ? props.expenseAmount / checkedList.length : 0;
  const valid = Boolean(props.expenseName && props.expenseAmount > 0 && props.payerId && checkedList.length);

  return (
    <div style={{ marginTop: 10 }}>
      <GroupedList>
        {members.map(member => {
          const name = personName(member.getFirstName(), member.getLastName());
          const checked = checkedList.includes(member.getId());
          return <ListRow key={member.getId()} leading={<span className={`tg-checkbox ${checked ? '' : 'is-unchecked'}`}><Icon name="check" size={15} /></span>} avatar={<Avatar name={name} size="sm" />} title={name} onClick={() => toggle(member.getId())} />;
        })}
      </GroupedList>
      <div className="tg-sticky-action"><PrimaryButton disabled={!valid} onClick={save}>Split by {share.toFixed(2)} {CURRENCIES[props.expenseCurrency]}</PrimaryButton></div>
    </div>
  );
}
