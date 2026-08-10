import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AccountContext, AccountUpdateFlagContext, BalanceListContext, BalanceUpdateFlagContext, ExpenseUpdateFlagContext, GroupListContext } from '../../app/App';
import { getCommand } from '../../entities/upload/common';
import { createDirectExpense, optimizePayments } from '../../entities/upload/expenses';
import { getRates } from '../../entities/upload/rates';
import { TBalanceList } from '../../entities/types/balance/balance_list';
import { TBalance } from '../../entities/types/balance/balance';
import { CURRENCIES } from '../../entities/data/currencies';
import { formatAmount } from '../../entities/utils/common';
import { haptic } from '../../entities/utils/telegram';
import { Avatar, EmptyState, GroupedList, Icon, ListRow, Modal, PrimaryButton, SkeletonRows, toneForAmount, TopBar } from '../../widgets/telegram-ui';

type ConvertedBalance = { userId: number; name: string; amount: number; sourceBalances: TBalance[] };

export default function GroupSettle() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groupList } = useContext(GroupListContext);
  const group = groupList.getItemById(Number(groupId));
  const { account } = useContext(AccountContext);
  const { accountUpdateFlag } = useContext(AccountUpdateFlagContext);
  const { balanceList, setBalanceList } = useContext(BalanceListContext);
  const { balanceUpdateFlag, setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);
  const { setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const [convertMode, setConvertMode] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [targetCurrency, setTargetCurrency] = useState<{ id: number; code: string } | null>(null);
  const [convertedBalances, setConvertedBalances] = useState<ConvertedBalance[]>([]);
  const [selectedBalance, setSelectedBalance] = useState<TBalance | null>(null);
  const [selectedConverted, setSelectedConverted] = useState<ConvertedBalance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [actionError, setActionError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [loadError, setLoadError] = useState('');
  const isPremium = !accountUpdateFlag && account.isPremium();

  const openPremium = () => {
    haptic('selection');
    navigate('/account/info');
  };

  useEffect(() => {
    if (!group || balanceUpdateFlag === group.getId()) return;
    const fetchData = async () => {
      setLoadError('');
      try {
        const response = await fetch(getCommand(`groups/get_balance_list&group_id=${groupId}`));
        if (!response.ok) throw new Error(`Balance request failed with status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.group_balances)) throw new Error('Balance response has an invalid shape');
        const balances = new TBalanceList();
        data.group_balances.forEach((item: any) => balances.addItem(new TBalance(item[0], item[1], item[2], item[3], item[4])));
        setBalanceList(balances);
        setActionError('');
      } catch (_) {
        setLoadError('Could not refresh payments. Please reopen this screen.');
      } finally {
        setBalanceUpdateFlag(group.getId());
      }
    };
    fetchData();
  }, [balanceUpdateFlag, group, groupId, setBalanceList, setBalanceUpdateFlag]);

  if (!group) return <main className="tg-page"><TopBar title="Settle up" onBack={() => navigate(`/groups/${groupId}`)} /></main>;

  const handleConvert = async (currencyId: string) => {
    if (!isPremium) {
      openPremium();
      return;
    }

    setSelectedCurrency(currencyId);
    if (!currencyId) {
      setConvertMode(false);
      setTargetCurrency(null);
      setConvertedBalances([]);
      return;
    }

    const targetId = Number(currencyId);
    const targetCode = CURRENCIES[currencyId];
    const response = await getRates(targetId);
    const data = await response.json();
    const rates: Record<number, number> = data.rates;
    const users = new Map<number, ConvertedBalance>();

    balanceList.getItems().forEach(balance => {
      const rate = rates[balance.getCurrency()];
      if (rate === undefined) return;
      const amount = Math.round(balance.getAmount() / rate);
      if (!amount) return;
      const current = users.get(balance.getUserId());
      if (current) {
        current.amount += amount;
        current.sourceBalances.push(balance);
      } else users.set(balance.getUserId(), { userId: balance.getUserId(), name: balance.getFirstAndLastName(), amount, sourceBalances: [balance] });
    });

    setConvertedBalances(Array.from(users.values()).filter(item => item.amount !== 0));
    setTargetCurrency({ id: targetId, code: targetCode });
    setConvertMode(true);
    haptic('selection');
  };

  const openPayment = (balance: TBalance) => {
    setSelectedBalance(balance);
    setSelectedConverted(null);
    setDialogOpen(true);
    setPaymentError('');
    haptic('selection');
  };

  const openConvertedPayment = (balance: ConvertedBalance) => {
    setSelectedConverted(balance);
    setSelectedBalance(null);
    setDialogOpen(true);
    setPaymentError('');
    haptic('selection');
  };

  const recordPayment = async () => {
    if (!selectedConverted && !selectedBalance) return;
    setRecording(true);
    setPaymentError('');
    try {
      const responses = selectedConverted
        ? await Promise.all(selectedConverted.sourceBalances.map(balance => createDirectExpense(groupId || '', balance.getAmount(), balance.getCurrency(), balance.getUserId(), balance.getFirstAndLastName())))
        : [await createDirectExpense(groupId || '', selectedBalance!.getAmount(), selectedBalance!.getCurrency(), selectedBalance!.getUserId(), selectedBalance!.getFirstAndLastName())];
      if (responses.some(response => !response.ok)) throw new Error('Payment request failed');
      setExpenseUpdateFlag(-1);
      setBalanceUpdateFlag(-1);
      setDialogOpen(false);
      setSelectedBalance(null);
      setSelectedConverted(null);
      haptic('success');
    } catch (_) {
      setPaymentError('Could not confirm this payment. Please try again.');
      haptic('error');
    } finally {
      setRecording(false);
    }
  };

  const optimize = async () => {
    if (!isPremium) {
      openPremium();
      return;
    }
    if (optimizing) return;
    setOptimizing(true);
    setActionError('');
    try {
      const response = await optimizePayments(groupId || '');
      if (!response.ok) setActionError('Could not verify the result. Refreshing payments…');
      else haptic('success');
    } catch (_) {
      setActionError('Could not verify the result. Refreshing payments…');
    } finally {
      setExpenseUpdateFlag(-1);
      setBalanceUpdateFlag(-1);
      setOptimizing(false);
    }
  };

  const loading = balanceUpdateFlag !== group.getId();
  const items = convertMode ? convertedBalances : balanceList.getItems();
  const selectedAmount = selectedConverted?.amount ?? selectedBalance?.getAmount() ?? 0;
  const selectedName = selectedConverted?.name ?? selectedBalance?.getFirstAndLastName() ?? '';
  const selectedSymbol = selectedConverted ? targetCurrency?.code || '' : selectedBalance?.getCurrencySymbol() || '';

  return (
    <main className="tg-page">
      <TopBar title="Settle up" onBack={() => navigate(`/groups/${groupId}`)} />
      <div className="tg-page-content is-padded-top">
        <h2 className="tg-section-title" style={{ marginTop: 2 }}>Suggested payments in {group.getName()}</h2>
        {loading ? <SkeletonRows count={3} /> : items.length ? (
          <GroupedList>
            {convertMode ? convertedBalances.map(item => (
              <ListRow key={item.userId} avatar={<Avatar name={item.name} size="sm" />} title={item.amount < 0 ? `Pay ${item.name}` : `${item.name} pays you`} subtitle="Tap to mark as paid" value={formatAmount(Math.abs(item.amount), targetCurrency?.code || '')} valueTone={toneForAmount(item.amount)} onClick={() => openConvertedPayment(item)} chevron />
            )) : balanceList.getItems().map(balance => (
              <ListRow key={`${balance.getUserId()}-${balance.getCurrency()}`} avatar={<Avatar name={balance.getFirstAndLastName()} size="sm" />} title={balance.getAmount() < 0 ? `Pay ${balance.getFirstAndLastName()}` : `${balance.getFirstAndLastName()} pays you`} subtitle="Tap to mark as paid" value={formatAmount(Math.abs(balance.getAmount()), balance.getCurrencySymbol())} valueTone={toneForAmount(balance.getAmount())} onClick={() => openPayment(balance)} chevron />
            ))}
          </GroupedList>
        ) : <EmptyState icon="check" title="All settled up" message="Nobody owes anything in this group." />}
        {loadError && <p className="tg-action-error">{loadError}</p>}

        <h2 className="tg-section-title">Display</h2>
        <GroupedList>
          {accountUpdateFlag ? (
            <ListRow title="Currency" subtitle="Checking Premium access…" value="Please wait" valueTone="muted" className="no-inset" />
          ) : isPremium ? (
            <div className="tg-list-row no-inset">
              <span className="tg-row-copy"><span className="tg-row-title">Currency</span><span className="tg-row-subtitle">Convert suggested payments for display</span></span>
              <select className="tg-currency-select" value={selectedCurrency} onChange={event => handleConvert(event.target.value)} aria-label="Target currency">
                <option value="">Original</option>
                {Object.entries(CURRENCIES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
              </select>
            </div>
          ) : (
            <ListRow title="Currency conversion" subtitle="Available with Premium" value={<Icon name="lock" size={16} />} valueTone="muted" onClick={openPremium} chevron className="no-inset" />
          )}
          {!accountUpdateFlag && !convertMode && (isPremium
            ? <ListRow title={optimizing ? 'Optimizing payments…' : 'Optimize suggested payments'} subtitle="Minimize the number of transfers" value={optimizing ? 'Please wait' : <Icon name="sparkles" size={18} />} valueTone="accent" onClick={optimizing ? undefined : optimize} chevron={!optimizing} className="no-inset" />
            : <ListRow title="Optimize suggested payments" subtitle="Available with Premium" value={<Icon name="lock" size={16} />} valueTone="muted" onClick={openPremium} chevron className="no-inset" />)}
        </GroupedList>
        {!convertMode && actionError && <p className="tg-action-error">{actionError}</p>}
      </div>

      <Modal
        open={dialogOpen}
        title="Mark payment as completed?"
        onClose={() => !recording && setDialogOpen(false)}
        footer={<><PrimaryButton outline disabled={recording} onClick={() => setDialogOpen(false)}>Cancel</PrimaryButton><PrimaryButton disabled={recording} onClick={recordPayment}>{recording ? 'Saving…' : 'Mark as paid'}</PrimaryButton></>}
      >
        {selectedName && <p>{selectedAmount < 0 ? <>Confirm that you paid <strong>{selectedName}</strong> {formatAmount(Math.abs(selectedAmount), selectedSymbol)}.</> : <>Confirm that <strong>{selectedName}</strong> paid you {formatAmount(selectedAmount, selectedSymbol)}.</>}</p>}
        {paymentError && <p className="tg-action-error">{paymentError}</p>}
      </Modal>
    </main>
  );
}
