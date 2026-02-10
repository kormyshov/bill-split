import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlSkeleton from '@shoelace-style/shoelace/dist/react/skeleton';

import { getCommand } from '../../entities/upload/common';

import { GroupListContext } from '../../app/App';
import { ExpenseListContext, BalanceListContext, BalanceUpdateFlagContext } from '../../app/App';
import { TGroup } from '../../entities/types/group/group';
import { TBalanceList } from '../../entities/types/balance/balance_list';

import { GRADIENTS } from '../../entities/data/gradients.ts';
import { CURRENCIES } from '../../entities/data/currencies.ts';
import { formatAmount } from '../../entities/utils/common.ts';
import { TBalance } from '../../entities/types/balance/balance.ts';


export default function GroupSettle() {

  const { groupId } = useParams();
  const { groupList } = useContext(GroupListContext);
  const group: TGroup = groupList.getItemById(Number(groupId)) as TGroup;

  const navigate = useNavigate();

  const { balanceList, setBalanceList } = useContext(BalanceListContext);
  const { balanceUpdateFlag, setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);

  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch(getCommand("groups/get_balance_list&group_id=" + groupId))

      const data = await response.json()
      console.log('Input balance list:', data)
      balanceList.clear();
      data.group_balances.forEach((item: any) => {
        const balance = new TBalance(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4]
        );
        balanceList.addItem(balance);
      })
      setBalanceList(new TBalanceList(balanceList.getItems()));
      setBalanceUpdateFlag(group.getId());
    }

    if (balanceUpdateFlag !== group.getId()) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceUpdateFlag]);

  const { expenseList } = useContext(ExpenseListContext);

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

  const balances = balanceList.getItems().map(
    (balance) => 
      <SlCard style={{ width: '100%', marginBottom: '1rem' }}>
        <b>{balance.getFirstAndLastName()}</b>
        <span
          {...(balance.getAmount() < 0 ? { style: {color: 'red', float: 'right' } } : { style: {color: 'green', float: 'right' } })}
        >
          {balance.getAmountFormatted()}
        </span>
      </SlCard>
  );

  return (
    <>

      <div style={{ background: GRADIENTS[group.getId() % 15], width: '100%', height: '10rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <div>
            <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/groups/' + groupId)} />
          </div>
          <div style={{ float: 'left' }}>
            <h2 style={{ marginBottom: '0px' }}>{group.getName()}</h2>
          </div>
          
          <div style={{ float: 'right', textAlign: 'right', marginTop: '1rem' }}>
            {totalsList}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Your balances:</h3>
        { balanceUpdateFlag !== group.getId() ?
            <>
              <SlSkeleton effect="sheen" style={{ height: '4rem', borderRadius: '0.2rem', width: '100%', marginBottom: '1rem' }} />
              <SlSkeleton effect="sheen" style={{ height: '4rem', borderRadius: '0.2rem', width: '100%', marginBottom: '1rem' }} />
              <SlSkeleton effect="sheen" style={{ height: '4rem', borderRadius: '0.2rem', width: '100%' }} />
            </>
          :
          balances.length > 0 ? balances : <p>All settled up!</p>
        }
      </div>
    </>
  );
}
