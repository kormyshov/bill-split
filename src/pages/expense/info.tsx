import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlFormatDate from '@shoelace-style/shoelace/dist/react/format-date';

import { TDebtList } from '../../entities/types/debt/debt_list';
import { TDebt } from '../../entities/types/debt/debt';
import { getCommand } from '../../entities/upload/common';


export default function ExpenseInfo() {

  const { groupId } = useParams();
  const { expenseId } = useParams();

  const navigate = useNavigate();

  const [expenseDebts, setExpenseDebts] = useState(new TDebtList());

  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch(getCommand("expenses/get_debt_list&expense_id=" + expenseId))

      const data = await response.json()
      console.log('Input debt list:', data)
      data.expense_debts.forEach((item: any) => {
        const expense = new TDebt(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4],
          item[5],
          item[6],
          item[7]
        );
        expenseDebts.addItem(expense);
      })
      setExpenseDebts(new TDebtList(expenseDebts.getItems()));
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lst = expenseDebts.getItems().map(
    (debt) => 
      <SlCard style={{ width: '100%', marginBottom: '1rem' }}>
        <b>{debt.getFirstAndLastName()}</b>
        <span style={{ float: 'right' }}>{debt.getDebtAmountFormatted()}</span>
      </SlCard>
  );

  const expenseName = expenseDebts.getItems()[0]?.getExpenseName() || 'Expense Info';
  const expenseTotalAmount = expenseDebts.getItems()[0]?.getTotalAmountFormatted() || '';
  const paidBy = expenseDebts.getItems()[0]?.getPaidByFirstAndLastName() || '';
  const createdAt = expenseDebts.getItems()[0]?.getCreatedAt() || '';

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', position: 'absolute', top: 0, left: 0, width: '100%', height: '20%', boxSizing: 'border-box', alignItems: 'center', display: 'flex' }}>
        <div style={{ padding: '1rem', width: '100%' }}>
          <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem', position: 'absolute', top: '1rem', left: '1rem' }} onClick={()=>navigate('/groups/' + groupId)} />
          <h1 style={{ marginBottom: '0px' }}>
            <span>{expenseName}</span>
            <span style={{ float: 'right' }}>{expenseTotalAmount}</span>
          </h1>
          <span>paid by {paidBy}</span><br />
          <span>at <SlFormatDate month="long" day="numeric" year="numeric" date={createdAt}/></span>
        </div>
      </div>
      <div style={{ position: 'absolute', top: '20%', left: 0, width: '100%', height: '80%', boxSizing: 'border-box', padding: '1rem' }}>
        {lst}
      </div>
    </>
  );
}
