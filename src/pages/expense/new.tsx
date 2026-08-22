import { ChangeEvent, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AccountContext, AccountUpdateFlagContext, ExpenseListContext, ExpenseUpdateFlagContext, MemberListContext, MemberUpdateFlagContext } from '../../app/App';
import { CURRENCIES } from '../../entities/data/currencies';
import { getCommand } from '../../entities/upload/common';
import { ReceiptScanError, scanReceipt } from '../../entities/upload/receipts';
import { TUserList } from '../../entities/types/user/user_list';
import { TUser } from '../../entities/types/user/user';
import { TExpenseList } from '../../entities/types/expense/expense_list';
import { TExpense } from '../../entities/types/expense/expense';
import EquallyExpenseTab from '../../widgets/tabs/equally_expense';
import CustomExpenseTab from '../../widgets/tabs/custom_expense';
import type { ReceiptPosition } from '../../widgets/tabs/custom_expense';
import { haptic } from '../../entities/utils/telegram';
import { Avatar, Icon, TopBar, personName } from '../../widgets/telegram-ui';

export default function NewExpense() {
  const { groupId } = useParams() as { groupId: string };
  const navigate = useNavigate();
  const { account } = useContext(AccountContext);
  const { accountUpdateFlag } = useContext(AccountUpdateFlagContext);
  const { memberList, setMemberList } = useContext(MemberListContext);
  const { memberUpdateFlag, setMemberUpdateFlag } = useContext(MemberUpdateFlagContext);
  const { expenseList, setExpenseList } = useContext(ExpenseListContext);
  const { expenseUpdateFlag, setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [mode, setMode] = useState<'equal' | 'custom'>('equal');
  const [receiptPositions, setReceiptPositions] = useState<ReceiptPosition[]>([]);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const currencyEntries = useMemo(() => {
    const used = expenseList.getItems().map(expense => expense.getCurrencySymbol());
    return Object.entries(CURRENCIES).sort((a, b) => {
      const aIndex = used.indexOf(a[1]);
      const bIndex = used.indexOf(b[1]);
      if (aIndex === -1 && bIndex === -1) return a[1].localeCompare(b[1]);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [expenseList]);

  const [expenseCurrency, setExpenseCurrency] = useState('2');
  const members = [...memberList.getItems()].sort((a, b) => {
    if (a.getId() === account.getId()) return -1;
    if (b.getId() === account.getId()) return 1;
    return personName(a.getFirstName(), a.getLastName()).localeCompare(personName(b.getFirstName(), b.getLastName()));
  });
  const [payerId, setPayerId] = useState(() => String(members[0]?.getId() || ''));
  useEffect(() => {
    if (!payerId && members[0]) setPayerId(String(members[0].getId()));
  }, [members, payerId]);

  useEffect(() => {
    if (memberList.getItemById(account.getId())) setPayerId(String(account.getId()));
  }, [account, memberList]);

  useEffect(() => {
    if (memberUpdateFlag !== Number(groupId)) {
      fetch(getCommand(`groups/get_member_list&group_id=${groupId}`)).then(response => response.json()).then(data => {
        const loadedMembers = new TUserList();
        data.group_members.forEach((item: any) => loadedMembers.addItem(new TUser(item[0], item[1], item[2], item[3], item[4], item[5])));
        setMemberList(loadedMembers);
        setMemberUpdateFlag(Number(groupId));
      });
    }

    if (expenseUpdateFlag !== Number(groupId)) {
      fetch(getCommand(`groups/get_expense_list&group_id=${groupId}`)).then(response => response.json()).then(data => {
        const loadedExpenses = new TExpenseList();
        data.group_expenses.forEach((item: any) => loadedExpenses.addItem(new TExpense(item[0], item[1], item[2], item[3], item[4], item[5], item[6])));
        setExpenseList(loadedExpenses);
        setExpenseUpdateFlag(Number(groupId));
      });
    }
  }, [expenseUpdateFlag, groupId, memberUpdateFlag, setExpenseList, setExpenseUpdateFlag, setMemberList, setMemberUpdateFlag]);

  useEffect(() => {
    const mostRecentCurrency = expenseList.getItems()[0]?.getCurrencySymbol();
    const entry = Object.entries(CURRENCIES).find(([, symbol]) => symbol === mostRecentCurrency);
    if (entry) setExpenseCurrency(entry[0]);
  }, [expenseList]);

  const isPremium = !accountUpdateFlag && account.isPremium();
  const openReceiptPicker = () => {
    if (accountUpdateFlag || isScanningReceipt) return;
    if (!isPremium) {
      haptic('selection');
      navigate('/account/info');
      return;
    }
    if (receiptPositions.length && !window.confirm('Replace the current receipt items with a new scan?')) return;
    setScanError('');
    receiptInputRef.current?.click();
  };

  const handleReceiptImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsScanningReceipt(true);
    setScanError('');
    setScanMessage('');
    setMode('custom');

    try {
      const receipt = await scanReceipt(file);
      const scannedItems = receipt.items.filter(item => Number.isFinite(item.price) && item.price > 0 && item.name?.trim());
      if (!scannedItems.length) throw new ReceiptScanError('No receipt items were recognized. Try a clearer photo.');

      const scanKey = Date.now();
      const positions = scannedItems.map((item, index) => ({
        id: `scan-${scanKey}-${index}`,
        name: item.quantity && item.quantity !== 1 ? `${item.name.trim()} ×${item.quantity}` : item.name.trim(),
        nameEn: typeof item.name_en === 'string' && item.name_en.trim()
          ? item.quantity && item.quantity !== 1 ? `${item.name_en.trim()} ×${item.quantity}` : item.name_en.trim()
          : undefined,
        amount: item.price,
        memberId: -1,
      }));
      const itemsTotal = positions.reduce((sum, position) => sum + position.amount, 0);
      const recognizedTotal = typeof receipt.total === 'number' && receipt.total > 0 ? receipt.total : itemsTotal;
      const messages = [`Found ${positions.length} ${positions.length === 1 ? 'item' : 'items'}. Check the amounts and assign each item.`];

      setReceiptPositions(positions);
      setExpenseAmount(String(Number(recognizedTotal.toFixed(2))));
      if (!expenseName.trim()) setExpenseName('Receipt');

      if (receipt.currency) {
        const currencyEntry = Object.entries(CURRENCIES).find(([, code]) => code === receipt.currency?.toUpperCase());
        if (currencyEntry) setExpenseCurrency(currencyEntry[0]);
        else messages.push(`${receipt.currency.toUpperCase()} is not available; choose the currency manually.`);
      } else {
        messages.push('The currency was not recognized; choose it manually.');
      }
      if (!(typeof receipt.total === 'number' && receipt.total > 0)) {
        messages.push('The total was not recognized, so the item sum was used.');
      }

      setScanMessage(messages.join(' '));
      haptic('success');
    } catch (error) {
      if (error instanceof ReceiptScanError && error.status === 403) {
        navigate('/account/info');
        return;
      }
      setScanError(error instanceof Error ? error.message : 'Receipt scanning failed. Please try again.');
      haptic('error');
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const payer = memberList.getItemById(Number(payerId)) || members[0];
  const amount = Number(expenseAmount);
  const commonProps = { groupId, groupMembers: memberList, expenseName: expenseName.trim(), expenseAmount: amount, expenseCurrency, payerId };

  return (
    <main className="tg-page">
      <TopBar title="Add expense" onBack={() => navigate(`/groups/${groupId}`)} />
      <div className="tg-form">
        <div className="tg-amount-line">
          <input className="tg-amount-input" type="number" inputMode="decimal" min="0" step="0.01" value={expenseAmount} onChange={event => setExpenseAmount(event.target.value)} placeholder="0.00" aria-label="Expense amount" autoFocus />
          <select className="tg-currency-select" value={expenseCurrency} onChange={event => setExpenseCurrency(event.target.value)} aria-label="Currency">
            {currencyEntries.map(([key, value]) => <option key={key} value={key}>{value}</option>)}
          </select>
        </div>
        <input className="tg-text-input" value={expenseName} onChange={event => setExpenseName(event.target.value)} placeholder="Expense name" aria-label="Expense name" />

        <div className="tg-receipt-scan">
          <input ref={receiptInputRef} className="tg-file-input" type="file" accept="image/jpeg,image/png" onChange={handleReceiptImage} aria-label="Receipt image" />
          <button type="button" className="tg-receipt-scan-button" onClick={openReceiptPicker} disabled={accountUpdateFlag || isScanningReceipt}>
            <span className="tg-receipt-scan-icon"><Icon name="sparkles" size={21} /></span>
            <span className="tg-row-copy">
              <span className="tg-row-title">{isScanningReceipt ? 'Scanning receipt…' : receiptPositions.length ? 'Scan receipt again' : 'Scan receipt'}</span>
              <span className="tg-row-subtitle">{isPremium ? 'Fill the total and receipt items from a photo' : accountUpdateFlag ? 'Checking Premium access…' : 'Available with Premium'}</span>
            </span>
            {isScanningReceipt ? <span className="tg-scan-spinner" aria-hidden="true" /> : <span className={isPremium ? 'tg-scan-chevron' : 'tg-scan-lock'}><Icon name={isPremium ? 'chevron' : 'lock'} size={17} /></span>}
          </button>
          {scanMessage && <p className="tg-scan-message" role="status">{scanMessage}</p>}
          {scanError && <p className="tg-scan-error" role="alert">{scanError}</p>}
        </div>

        <div className="tg-list-row no-inset" style={{ marginTop: 7, paddingLeft: 1, paddingRight: 1 }}>
          <span className="tg-row-copy" style={{ flex: '0 0 auto' }}><span className="tg-row-title">Paid by</span></span>
          {payer && <Avatar name={personName(payer.getFirstName(), payer.getLastName())} size="sm" />}
          <select className="tg-currency-select" style={{ flex: 1 }} value={payerId || String(members[0]?.getId() || '')} onChange={event => setPayerId(event.target.value)} aria-label="Paid by">
            {members.map(member => <option key={member.getId()} value={member.getId()}>{personName(member.getFirstName(), member.getLastName())}</option>)}
          </select>
        </div>

        <label className="tg-field-label">Split between</label>
        <div className="tg-segmented" role="tablist" aria-label="Split method">
          <button type="button" role="tab" aria-selected={mode === 'equal'} className={`tg-segment ${mode === 'equal' ? 'is-active' : ''}`} onClick={() => setMode('equal')}>Equal</button>
          <button type="button" role="tab" aria-selected={mode === 'custom'} className={`tg-segment ${mode === 'custom' ? 'is-active' : ''}`} onClick={() => setMode('custom')}>Custom</button>
        </div>

        {mode === 'equal' ? <EquallyExpenseTab {...commonProps} /> : <CustomExpenseTab {...commonProps} positions={receiptPositions} setPositions={setReceiptPositions} />}
      </div>
    </main>
  );
}
