import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlFormatDate from '@shoelace-style/shoelace/dist/react/format-date';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlSkeleton from '@shoelace-style/shoelace/dist/react/skeleton';

import { BalanceUpdateFlagContext, ExpenseUpdateFlagContext } from '../../app/App';

import { TDebtList } from '../../entities/types/debt/debt_list';
import { TDebt } from '../../entities/types/debt/debt';
import { getCommand } from '../../entities/upload/common';
import { deleteExpense } from '../../entities/upload/expenses';


export default function ExpenseInfo() {

  const { groupId } = useParams();
  const { expenseId } = useParams();

  const { setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const { setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);

  const navigate = useNavigate();

  const [expenseDebts, setExpenseDebts] = useState(new TDebtList());
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lst = expenseDebts.getItems().map(
    (debt) => 
      <SlCard key={debt.getId()} style={{ width: '100%', marginBottom: '1rem' }}>
        <b>{debt.getFirstAndLastName()}</b>
        <span style={{ float: 'right' }}>{debt.getDebtAmountFormatted()}</span>
      </SlCard>
  );

  const handleDeleteExpense = () => {
    deleteExpense(Number(expenseId));
    setExpenseUpdateFlag(-1);
    setBalanceUpdateFlag(-1);
    navigate('/groups/' + groupId);
  }

  const expenseName = expenseDebts.getItems()[0]?.getExpenseName() || 'Expense Info';
  const expenseTotalAmount = expenseDebts.getItems()[0]?.getTotalAmountFormatted() || '';
  const paidBy = expenseDebts.getItems()[0]?.getPaidByFirstAndLastName() || '';
  const createdAt = expenseDebts.getItems()[0]?.getCreatedAt() || '';

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', height: '12rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/groups/' + groupId)} />
          { loading ?
            <>
              <div style={{ marginTop: '1rem' }}>
                <SlSkeleton effect="sheen" style={{ height: '2rem',  width: '38%', float: 'left', marginBottom: '0.4rem' }} />
                <SlSkeleton effect="sheen" style={{ height: '2rem',  width: '30%', float: 'right' }} />
                <SlSkeleton effect="sheen" style={{ height: '1rem',  width: '45%', clear: 'both', marginBottom: '0.2rem' }} />
                <SlSkeleton effect="sheen" style={{ height: '1rem',  width: '40%', clear: 'both', marginBottom: '0.4rem' }} />
              </div>
            </>
            :
            <>
              <h2 style={{ marginBottom: '0px' }}>
                <span>{expenseName}</span>
                <span style={{ float: 'right' }}>{expenseTotalAmount}</span>
              </h2>
              <span>paid by {paidBy}</span><br />
              <span>at <SlFormatDate month="long" day="numeric" year="numeric" date={createdAt}/></span>
            </>
          }
        </div>
      </div>
      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        { loading ?
          <div style={{ left: 0, width: '100%', boxSizing: 'border-box' }}>
            <SlSkeleton effect="sheen" style={{ height: '4rem', borderRadius: '0.2rem', width: '100%', marginBottom: '1rem' }} />
            <SlSkeleton effect="sheen" style={{ height: '4rem', borderRadius: '0.2rem', width: '100%' }} />
          </div>
        :
          lst
        }
        <SlButton 
          variant="danger" 
          style={{ marginTop: '2rem', width: '100%' }} 
          onClick={() => handleDeleteExpense()} 
          outline
        >
          Delete expense
        </SlButton>
      </div>
    </>
  );
}
