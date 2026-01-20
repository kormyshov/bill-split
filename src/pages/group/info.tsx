import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlBadge from '@shoelace-style/shoelace/dist/react/badge';
import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlButton from '@shoelace-style/shoelace/dist/react/button';

import { getCommand } from '../../entities/upload/common';

import { GroupListContext } from '../../app/App';
import { TGroup } from '../../entities/types/group/group';
import { TExpenseList } from '../../entities/types/expense/expense_list';
import { TExpense } from '../../entities/types/expense/expense';


export default function GroupInfo() {

  const { groupId } = useParams();
  const { groupList } = useContext(GroupListContext);
  const group: TGroup = groupList.getItemById(Number(groupId)) as TGroup;

  const navigate = useNavigate();

  const [groupExpenses, setGroupExpenses] = useState(new TExpenseList());

  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch(getCommand("groups/get_expense_list&group_id=" + groupId))

      const data = await response.json()
      console.log('Input expense list:', data)
      data.group_expenses.forEach((item: any) => {
        const expense = new TExpense(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4],
          item[5]
        );
        groupExpenses.addItem(expense);
      })
      setGroupExpenses(new TExpenseList(groupExpenses.getItems()));
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lst = groupExpenses.getItems().map(
    (expense) => 
      <Link key={group.getId()} to={`/groups/${group.getId()}/expenses/${expense.getId()}`} style={{ textDecoration: 'none' }}>
        <SlCard style={{ width: '100%', marginBottom: '1rem' }}>
          <b>{expense.getName()}</b>
          <span style={{ float: 'right' }}>{expense.getAmountFormatted()}</span>
          <br />
          <small>paid by {expense.getFirstAndLastName()}</small>
        </SlCard>
      </Link>
  );

  return (
    <>
      <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/')} />
      <SlIconButton name="gear" label="Settings" style={{ fontSize: '1.5rem', float: 'right' }} onClick={()=>navigate('/groups/' + groupId + '/settings')} />
      <h1 style={{ marginBottom: '0px' }}>{group.getName()}</h1>
      <SlBadge variant="neutral">{group.getCount()} member(s)</SlBadge>

      <br /><br />
      <SlButton variant="primary" style={{ width: '100%' }} onClick={()=>navigate('/groups/' + groupId + '/new_expense')}>Add expense</SlButton>

      <div style={{ marginTop: '2rem' }}>
        {lst}
      </div>
    </>
  );
}
