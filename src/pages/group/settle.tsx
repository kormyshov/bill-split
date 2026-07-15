import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlSkeleton from '@shoelace-style/shoelace/dist/react/skeleton';
import SlDialog from '@shoelace-style/shoelace/dist/react/dialog';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlSelect from '@shoelace-style/shoelace/dist/react/select';
import SlOption from '@shoelace-style/shoelace/dist/react/option';

import { getCommand } from '../../entities/upload/common';

import { GroupListContext } from '../../app/App';
import { BalanceListContext, BalanceUpdateFlagContext, ExpenseUpdateFlagContext } from '../../app/App';
import { TGroup } from '../../entities/types/group/group';
import { TBalanceList } from '../../entities/types/balance/balance_list';

import { GRADIENTS } from '../../entities/data/gradients.ts';
import { CURRENCIES } from '../../entities/data/currencies.ts';
import { formatAmount } from '../../entities/utils/common.ts';
import { TBalance } from '../../entities/types/balance/balance.ts';
import { createDirectExpense, optimizePayments } from '../../entities/upload/expenses.ts';
import { getRates } from '../../entities/upload/rates.ts';
import PremiumButton from '../../widgets/premium_button.tsx';


export default function GroupSettle() {

  const { groupId } = useParams();
  const { groupList } = useContext(GroupListContext);
  const group: TGroup = groupList.getItemById(Number(groupId)) as TGroup;

  const navigate = useNavigate();

  const { balanceList, setBalanceList } = useContext(BalanceListContext);
  const { balanceUpdateFlag, setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);
  const { setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);

  const [convertMode, setConvertMode] = useState(false);
  const [targetCurrency, setTargetCurrency] = useState<{ id: number; code: string } | null>(null);
  const [convertedBalances, setConvertedBalances] = useState<Array<{
    userId: number;
    name: string;
    amount: number;
    sourceBalances: TBalance[];
  }>>([]);
  const [selectedCurrencyForConvert, setSelectedCurrencyForConvert] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<TBalance | null>(null);
  const [selectedConvertedBalance, setSelectedConvertedBalance] = useState<{
    userId: number;
    name: string;
    amount: number;
    sourceBalances: TBalance[];
  } | null>(null);

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

  const handleConvert = async () => {
    if (!selectedCurrencyForConvert) return;

    const targetId = Number(selectedCurrencyForConvert);
    const targetCode = CURRENCIES[selectedCurrencyForConvert];

    const response = await getRates(targetId);
    const data = await response.json();
    const rates: Record<number, number> = data.rates;
    console.log('Rates:', rates);

    const userMap = new Map<number, { name: string; amount: number; sourceBalances: TBalance[] }>();

    balanceList.getItems().forEach((balance) => {
      const rate = rates[balance.getCurrency()];
      if (rate === undefined) return;

      const convertedAmount = Math.round(balance.getAmount() / rate);
      if (convertedAmount === 0) return;

      const userId = balance.getUserId();
      const existing = userMap.get(userId);
      if (existing) {
        existing.amount += convertedAmount;
        existing.sourceBalances.push(balance);
      } else {
        userMap.set(userId, {
          name: balance.getFirstAndLastName(),
          amount: convertedAmount,
          sourceBalances: [balance],
        });
      }
    });

    const result = Array.from(userMap.entries())
      .filter(([_, v]) => v.amount !== 0)
      .map(([userId, v]) => ({ userId, ...v }));

    setConvertedBalances(result);
    setTargetCurrency({ id: targetId, code: targetCode });
    setConvertMode(true);
  }

  const handleResetConvert = () => {
    setConvertMode(false);
    setTargetCurrency(null);
    setConvertedBalances([]);
  }

  const handleOpenConvertedDialog = (item: typeof convertedBalances[0]) => {
    setSelectedConvertedBalance(item);
    setDialogOpen(true);
  }

  const handleCreateConvertedPayment = () => {
    if (!selectedConvertedBalance) return;

    selectedConvertedBalance.sourceBalances.forEach((balance) => {
      createDirectExpense(
        groupId || '',
        balance.getAmount(),
        balance.getCurrency(),
        balance.getUserId(),
        balance.getFirstAndLastName()
      );
    });

    setExpenseUpdateFlag(-1);
    setBalanceUpdateFlag(-1);
    setDialogOpen(false);
    setConvertMode(false);
    setTargetCurrency(null);
    setConvertedBalances([]);
    setSelectedConvertedBalance(null);
  }

  const originalBalances = balanceList.getItems().map(
    (balance) =>
      <SlCard key={`${balance.getUserId()}-${balance.getCurrency()}`} style={{ width: '100%', marginBottom: '1rem' }} onClick={() => handleOpenDialog(balance)}>
        <b>{balance.getFirstAndLastName()}</b>
        <span
          {...(balance.getAmount() < 0 ? { style: {color: 'red', float: 'right' } } : { style: {color: 'green', float: 'right' } })}
        >
          {balance.getAmountFormatted()}
        </span>
      </SlCard>
  );



  const convertedCards = convertedBalances.map((item) => (
    <SlCard key={`conv-${item.userId}`} style={{ width: '100%', marginBottom: '1rem' }} onClick={() => handleOpenConvertedDialog(item)}>
      <b>{item.name}</b>
      <span
        {...(item.amount < 0 ? { style: {color: 'red', float: 'right' } } : { style: {color: 'green', float: 'right' } })}
      >
        {formatAmount(item.amount, targetCurrency?.code || '')}
      </span>
    </SlCard>
  ));

  const dialogLabel = convertMode ? `Converted to ${targetCurrency?.code || ''}` : 'Record a payment';

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
          convertMode && convertedBalances.length > 0 ?
          <>
            <small>Showing balances converted to <b>{targetCurrency?.code}</b></small>
            <div style={{ height: '0.5rem' }} />
            {convertedCards}
            <SlButton variant="primary" style={{ width: '100%' }} onClick={handleResetConvert}>Reset</SlButton>
          </>
          :
          convertMode && convertedBalances.length === 0 ?
          <>
            <p>All settled up!</p>
            <SlButton variant="primary" style={{ width: '100%' }} onClick={handleResetConvert}>Reset</SlButton>
          </>
          :
          originalBalances.length > 0 ?
            <>
              {originalBalances}
              <div style={{ marginBottom: '0.5rem' }}>
                <PremiumButton onCLick={handleOptimizePayments} isLimitExceeded={true} title='Optimize' />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '200px', flexShrink: 0 }}>
                  <PremiumButton onCLick={handleConvert} isLimitExceeded={true} title='Convert to' />
                </div>
                <div style={{ flex: 1 }}>
                  <SlSelect
                    value={selectedCurrencyForConvert}
                    placeholder="Currency"
                    onSlChange={(e) => setSelectedCurrencyForConvert((e.target as HTMLSelectElement).value)}
                  >
                    {Object.entries(CURRENCIES).map(([key, value]) => (
                      <SlOption key={key} value={key}>{value}</SlOption>
                    ))}
                  </SlSelect>
                </div>
              </div>
            </>
            :
            <p>All settled up!</p>
        }
      </div>

      <SlDialog label={dialogLabel} open={dialogOpen} onSlAfterHide={() => {
        setDialogOpen(false);
        setSelectedConvertedBalance(null);
      }}>
        { convertMode && selectedConvertedBalance ? (
          selectedConvertedBalance.amount < 0 ?
            <>You paid <b>{selectedConvertedBalance.name}</b> {formatAmount(-selectedConvertedBalance.amount, targetCurrency?.code || '')}?</>
          :
            <><b>{selectedConvertedBalance.name}</b> paid you {formatAmount(selectedConvertedBalance.amount, targetCurrency?.code || '')}?</>
        ) : !convertMode && selectedBalance ? (
          selectedBalance.getAmount() < 0 ?
            <>You paid <b>{selectedBalance.getFirstAndLastName()}</b> {formatAmount(-selectedBalance.getAmount(), selectedBalance.getCurrencySymbol())}?</>
          :
            <><b>{selectedBalance.getFirstAndLastName()}</b> paid you {selectedBalance?.getAmountFormatted()}?</>
        ) : null }
        <SlButton slot="footer" variant="neutral" onClick={() => {
          setDialogOpen(false);
          setSelectedConvertedBalance(null);
        }}>
          Cancel
        </SlButton>
        <SlButton slot="footer" variant="success" onClick={convertMode ? handleCreateConvertedPayment : handleCreatePayment}>
          Save
        </SlButton>
      </SlDialog>
    </>
  );
}
