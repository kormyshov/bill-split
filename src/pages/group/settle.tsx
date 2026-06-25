import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlSkeleton from '@shoelace-style/shoelace/dist/react/skeleton';
import SlDialog from '@shoelace-style/shoelace/dist/react/dialog';
import SlButton from '@shoelace-style/shoelace/dist/react/button';

import { getCommand } from '../../entities/upload/common';

import { GroupListContext } from '../../app/App';
import { BalanceListContext, BalanceUpdateFlagContext, ExpenseUpdateFlagContext } from '../../app/App';
import { TGroup } from '../../entities/types/group/group';
import { TBalanceList } from '../../entities/types/balance/balance_list';

import { GRADIENTS } from '../../entities/data/gradients.ts';
import { formatAmount } from '../../entities/utils/common.ts';
import { TBalance } from '../../entities/types/balance/balance.ts';
import { createDirectExpense, optimizePayments } from '../../entities/upload/expenses.ts';


export default function GroupSettle() {

  const { groupId } = useParams();
  const { groupList } = useContext(GroupListContext);
  const group: TGroup = groupList.getItemById(Number(groupId)) as TGroup;

  const navigate = useNavigate();

  const { balanceList, setBalanceList } = useContext(BalanceListContext);
  const { balanceUpdateFlag, setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);
  const { setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);

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

  const balances = balanceList.getItems().map(
    (balance) => 
      <SlCard style={{ width: '100%', marginBottom: '1rem' }} onClick={() => handleOpenDialog(balance)}>
        <b>{balance.getFirstAndLastName()}</b>
        <span
          {...(balance.getAmount() < 0 ? { style: {color: 'red', float: 'right' } } : { style: {color: 'green', float: 'right' } })}
        >
          {balance.getAmountFormatted()}
        </span>
      </SlCard>
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<TBalance | null>(null);

  const handleOpenDialog = (balance: TBalance) => {
    setSelectedBalance(balance);
    setDialogOpen(true)
  }

  const handleCreatePayment = () => {
    createDirectExpense(
      groupId || '',
      selectedBalance?.getAmount() || 0,
      selectedBalance?.getCurrency() || 0,
      selectedBalance?.getUserId() || 0,
      selectedBalance?.getFirstAndLastName() || ''
    );
    setExpenseUpdateFlag(-1);
    setBalanceUpdateFlag(-1);
    setDialogOpen(false);
  }

  const handleOptimizePayments = () => {
    optimizePayments(groupId || '');
    setExpenseUpdateFlag(-1);
    setBalanceUpdateFlag(-1);
  }

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
          balances.length > 0 ? 
            <>
              {balances}
              <SlButton variant="primary" style={{ width: '100%' }} onClick={()=>{handleOptimizePayments()}}>Optimize</SlButton>
            </>
            : 
            <p>All settled up!</p>
        }
      </div>

      <SlDialog label="Record a payment" open={dialogOpen} onSlAfterHide={() => setDialogOpen(false)}>
        { selectedBalance ? (
          selectedBalance.getAmount() < 0 ?
            <>You paid <b>{selectedBalance.getFirstAndLastName()}</b> {formatAmount(-selectedBalance.getAmount(), selectedBalance.getCurrencySymbol())}?</>
          :
            <><b>{selectedBalance.getFirstAndLastName()}</b> paid you {selectedBalance?.getAmountFormatted()}?</>
          ) : null
        }
        <SlButton slot="footer" variant="neutral" onClick={() => setDialogOpen(false)}>
          Cancel
        </SlButton>
        <SlButton slot="footer" variant="success" onClick={() => handleCreatePayment()}>
          Save
        </SlButton>
      </SlDialog>
    </>
  );
}
