import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlBadge from '@shoelace-style/shoelace/dist/react/badge';
import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlSkeleton from '@shoelace-style/shoelace/dist/react/skeleton';

import { getCommand } from '../../entities/upload/common';

import { GroupListContext } from '../../app/App';
import { ExpenseListContext } from '../../app/App';
import { ExpenseUpdateFlagContext } from '../../app/App';
import { MemberListContext } from '../../app/App';
import { MemberUpdateFlagContext } from '../../app/App';
import { TGroup } from '../../entities/types/group/group';
import { TExpenseList } from '../../entities/types/expense/expense_list';
import { TExpense } from '../../entities/types/expense/expense';
import { TUserList } from '../../entities/types/user/user_list';
import { TUser } from '../../entities/types/user/user';

import { GRADIENTS } from '../../entities/data/gradients.ts';
import { CURRENCIES } from '../../entities/data/currencies.ts';
import { formatAmount } from '../../entities/utils/common.ts';

import PremiumButton from '../../widgets/premium_button.tsx';


export default function GroupInfo() {

  const { groupId } = useParams();
  const { groupList } = useContext(GroupListContext);
  const group: TGroup = groupList.getItemById(Number(groupId)) as TGroup;

  const navigate = useNavigate();

  const { expenseList, setExpenseList } = useContext(ExpenseListContext);
  const { expenseUpdateFlag, setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);

  const { memberList, setMemberList } = useContext(MemberListContext);
  const { memberUpdateFlag, setMemberUpdateFlag } = useContext(MemberUpdateFlagContext);

  useEffect(() => {
    const fetchExpenseData = async () => {
      const response = await fetch(getCommand("groups/get_expense_list&group_id=" + groupId))

      const data = await response.json()
      console.log('Input expense list:', data)
      expenseList.clear();
      data.group_expenses.forEach((item: any) => {
        const expense = new TExpense(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4],
          item[5],
          item[6]
        );
        expenseList.addItem(expense);
      })
      setExpenseList(new TExpenseList(expenseList.getItems()));
      setExpenseUpdateFlag(group.getId());
    }

    const fetchMemberData = async () => {
      const response = await fetch(getCommand("groups/get_member_list&group_id=" + groupId))

      const data = await response.json()
      console.log('Input member list:', data)
      memberList.clear();
      data.group_members.forEach((item: any) => {
        const user = new TUser(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4]
        );
        memberList.addItem(user);
      })
      setMemberList(new TUserList(memberList.getItems()));
      setMemberUpdateFlag(group.getId());
    }

    if (expenseUpdateFlag !== group.getId()) fetchExpenseData();
    if (memberUpdateFlag !== group.getId()) fetchMemberData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseUpdateFlag, memberUpdateFlag]);

  const lst = expenseList.getItems().map(
    (expense) => 

           expense.getName().includes(' paid ') && expense.getName().includes(expense.getFirstAndLastName()) ?
            <>
            <SlCard style={{ width: '100%', marginBottom: '1rem' }}>
              <small>{expense.getName()}</small>
              <span style={{ float: 'right' }}>{expense.getAmountFormatted()}</span>
            </SlCard>
            </>
            :
            <>
          <Link key={expense.getId()} to={`/groups/${group.getId()}/expenses/${expense.getId()}`} style={{ textDecoration: 'none' }}>
            <SlCard style={{ width: '100%', marginBottom: '1rem' }}>
              <b>{expense.getName()}</b>
              <span style={{ float: 'right' }}>{expense.getAmountFormatted()}</span>
              <br />
              <small>paid by {expense.getFirstAndLastName()}</small>
              <small 
                {...(expense.getDebtAmount() < 0 ? { style: {color: 'red', float: 'right'} } : { style: {color: 'green', float: 'right'} })}
              >
                {expense.getDebtAmountFormatted()}
              </small> 
            </SlCard>
          </Link>
            </>
          
  );

  const totals = Object.entries(CURRENCIES).map(([key, value]) => {
    return {
      id: key,
      symbol: value,
      amount: expenseList.getItems().filter(e => e.getCurrencySymbol() === value).reduce((sum, e) => sum + e.getDebtAmount(), 0)
    }
  });

  const totalsList = totals.filter(t => t.amount !== 0).map(t => 
    <span
      {...(t.amount < 0 ? { style: {color: 'red'} } : { style: {color: 'green'} })}
    >
      <b>{formatAmount(t.amount, t.symbol)}</b><br />
    </span>
  );

  return (
    <>

      <div style={{ background: GRADIENTS[group.getId() % 15], width: '100%', height: '10rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <div>
            <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/')} />
            <SlIconButton name="gear" label="Settings" style={{ fontSize: '1.5rem', float: 'right' }} onClick={()=>navigate('/groups/' + groupId + '/settings')} />
          </div>
          <div style={{ float: 'left' }}>
            <h2 style={{ marginBottom: '0px' }}>{group.getName()}</h2>
            <SlBadge variant="neutral">{group.getCount()} member(s)</SlBadge>
          </div>
          
          <div style={{ float: 'right', textAlign: 'right', marginTop: '1rem' }}>
            {totalsList}
            <SlButton variant="success" size="small" onClick={()=>navigate('/groups/' + groupId + '/settle')}>Settle up</SlButton>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        {/* <SlButton variant="primary" style={{ width: '100%' }} onClick={()=>navigate('/groups/' + groupId + '/new_expense')}>Add expense</SlButton> */}
        <PremiumButton onCLick={() => navigate('/groups/' + groupId + '/new_expense')} isLimitExceeded={lst.length > 49} title='Add expense' />

        <div style={{ marginTop: '1rem' }}>
          { expenseUpdateFlag !== group.getId() ?
            <div style={{ left: 0, width: '100%', boxSizing: 'border-box' }}>
              <SlSkeleton effect="sheen" style={{ height: '4.8rem', borderRadius: '0.2rem', width: '100%', marginBottom: '1rem' }} />
              <SlSkeleton effect="sheen" style={{ height: '4.8rem', borderRadius: '0.2rem', width: '100%', marginBottom: '1rem' }} />
              <SlSkeleton effect="sheen" style={{ height: '4.8rem', borderRadius: '0.2rem', width: '100%' }} />
            </div>
            :
             lst
          }
        </div>
      </div>
    </>
  );
}
