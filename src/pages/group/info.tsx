import React, { useContext, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getCommand } from '../../entities/upload/common';
import { ExpenseListContext, ExpenseUpdateFlagContext, GroupListContext, MemberListContext, MemberUpdateFlagContext } from '../../app/App';
import { TExpenseList } from '../../entities/types/expense/expense_list';
import { TExpense } from '../../entities/types/expense/expense';
import { TUserList } from '../../entities/types/user/user_list';
import { TUser } from '../../entities/types/user/user';
import { CURRENCIES } from '../../entities/data/currencies';
import { formatAmount } from '../../entities/utils/common';
import PremiumButton from '../../widgets/premium_button';
import { Avatar, EmptyState, GroupedList, Icon, ListRow, PrimaryButton, SkeletonRows, toneForAmount, TopBar } from '../../widgets/telegram-ui';

function expenseIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('taxi') || normalized.includes('ride')) return { name: 'car' as const, tone: 'is-green' };
  if (normalized.includes('museum') || normalized.includes('ticket')) return { name: 'building' as const, tone: 'is-violet' };
  return { name: 'receipt' as const, tone: '' };
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export default function GroupInfo() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groupList } = useContext(GroupListContext);
  const group = groupList.getItemById(Number(groupId));
  const { expenseList, setExpenseList } = useContext(ExpenseListContext);
  const { expenseUpdateFlag, setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const { setMemberList } = useContext(MemberListContext);
  const { memberUpdateFlag, setMemberUpdateFlag } = useContext(MemberUpdateFlagContext);

  useEffect(() => {
    if (!group) return;

    const fetchExpenseData = async () => {
      const response = await fetch(getCommand(`groups/get_expense_list&group_id=${groupId}`));
      const data = await response.json();
      const expenses = new TExpenseList();
      data.group_expenses.forEach((item: any) => expenses.addItem(new TExpense(item[0], item[1], item[2], item[3], item[4], item[5], item[6])));
      setExpenseList(expenses);
      setExpenseUpdateFlag(group.getId());
    };

    const fetchMemberData = async () => {
      const response = await fetch(getCommand(`groups/get_member_list&group_id=${groupId}`));
      const data = await response.json();
      const members = new TUserList();
      data.group_members.forEach((item: any) => members.addItem(new TUser(item[0], item[1], item[2], item[3], item[4], item[5])));
      setMemberList(members);
      setMemberUpdateFlag(group.getId());
    };

    if (expenseUpdateFlag !== group.getId()) fetchExpenseData();
    if (memberUpdateFlag !== group.getId()) fetchMemberData();
  }, [expenseUpdateFlag, group, groupId, memberUpdateFlag, setExpenseList, setExpenseUpdateFlag, setMemberList, setMemberUpdateFlag]);

  const totals = useMemo(() => Object.entries(CURRENCIES).map(([key, value]) => ({
    id: key,
    symbol: value,
    amount: expenseList.getItems().filter(expense => expense.getCurrencySymbol() === value).reduce((sum, expense) => sum + expense.getDebtAmount(), 0),
  })).filter(total => total.amount !== 0), [expenseList]);

  if (!group) {
    return <main className="tg-page"><TopBar title="Group" onBack={() => navigate('/')} /><div className="tg-page-content is-padded-top"><SkeletonRows count={4} /></div></main>;
  }

  const expenses = expenseList.getItems();
  const loading = expenseUpdateFlag !== group.getId();

  return (
    <main className="tg-page">
      <TopBar
        title={group.getName()}
        onBack={() => navigate('/')}
        right={<button className="tg-nav-button" type="button" onClick={() => navigate(`/groups/${groupId}/settings`)} aria-label="Group settings"><Icon name="settings" size={22} /></button>}
      />

      <section className="tg-hero">
        <div className="tg-hero-heading">
          <Avatar name={group.getName()} size="md" />
          <div><h2>{group.getName()}</h2><p>{group.getCount()} {group.getCount() === 1 ? 'member' : 'members'}</p></div>
        </div>

        {totals.length > 0 && (
          <div className="tg-total-grid">
            {totals.slice(0, 3).map(total => (
              <div className={`tg-total-card is-${toneForAmount(total.amount)}`} key={total.id}>
                <span>{total.symbol}</span>
                <strong>{total.amount > 0 ? '+' : ''}{formatAmount(total.amount, '')}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="tg-button-row" style={{ marginTop: 12 }}>
          <PrimaryButton outline onClick={() => navigate(`/groups/${groupId}/settle`)}>Settle up</PrimaryButton>
          <PremiumButton onCLick={() => navigate(`/groups/${groupId}/new_expense`)} isLimitExceeded={expenses.length > 49} title={<><Icon name="plus" size={18} /> Add expense</>} />
        </div>
      </section>

      <div className="tg-page-content is-padded-top">
        <h2 className="tg-section-title" style={{ marginTop: 2 }}>Expenses</h2>
        {loading ? <SkeletonRows count={3} /> : (
          expenses.length ? <GroupedList>
            {expenses.map(expense => {
              const payment = expense.getName().includes(' paid ') && expense.getName().includes(expense.getFirstAndLastName());
              const icon = expenseIcon(expense.getName());
              const debt = expense.getDebtAmount();
              return (
                <ListRow
                  key={expense.getId()}
                  avatar={<span className={`tg-expense-icon ${icon.tone}`}><Icon name={icon.name} size={20} /></span>}
                  title={expense.getName()}
                  subtitle={payment ? `${shortDate(expense.getCreatedAt())} · Payment` : `Paid by ${expense.getFirstAndLastName()} · ${shortDate(expense.getCreatedAt())}`}
                  value={<>{expense.getAmountFormatted()}{!payment && debt !== 0 && <span className={`tg-balance-note is-${toneForAmount(debt)}`}>{debt < 0 ? `You owe ${formatAmount(Math.abs(debt), expense.getCurrencySymbol())}` : `You're owed ${formatAmount(debt, expense.getCurrencySymbol())}`}</span>}</>}
                  onClick={payment ? undefined : () => navigate(`/groups/${group.getId()}/expenses/${expense.getId()}`)}
                />
              );
            })}
          </GroupedList> : <EmptyState title="No expenses yet" message="Add the first shared expense to start tracking balances." />
        )}
      </div>
    </main>
  );
}
