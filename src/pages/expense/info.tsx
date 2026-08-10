import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { BalanceUpdateFlagContext, ExpenseUpdateFlagContext } from '../../app/App';
import { TDebtList } from '../../entities/types/debt/debt_list';
import { TDebt } from '../../entities/types/debt/debt';
import { getCommand } from '../../entities/upload/common';
import { deleteExpense } from '../../entities/upload/expenses';
import { haptic } from '../../entities/utils/telegram';
import { Avatar, GroupedList, Icon, ListRow, Modal, PrimaryButton, SkeletonRows, TopBar } from '../../widgets/telegram-ui';

function fullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function ExpenseInfo() {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();
  const { setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const { setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);
  const [expenseDebts, setExpenseDebts] = useState(new TDebtList());
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(getCommand(`expenses/get_debt_list&expense_id=${expenseId}`));
      const data = await response.json();
      const debts = new TDebtList();
      data.expense_debts.forEach((item: any) => debts.addItem(new TDebt(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7])));
      setExpenseDebts(debts);
      setLoading(false);
    };
    fetchData();
  }, [expenseId]);

  const performDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await deleteExpense(Number(expenseId));
      if (!response.ok) throw new Error(`Delete failed with status ${response.status}`);
      setExpenseUpdateFlag(-1);
      setBalanceUpdateFlag(-1);
      haptic('warning');
      navigate(`/groups/${groupId}`);
    } catch (_) {
      setDeleteError('Could not delete this expense. Please try again.');
      haptic('error');
    } finally {
      setDeleting(false);
    }
  };

  const debts = expenseDebts.getItems();
  const expense = debts[0];
  const expenseName = expense?.getExpenseName() || 'Expense details';

  return (
    <main className="tg-page">
      <TopBar title="Expense details" onBack={() => navigate(`/groups/${groupId}`)} />
      {loading ? <div className="tg-page-content is-padded-top"><SkeletonRows count={4} /></div> : (
        <>
          <section className="tg-detail-hero">
            <span className="tg-expense-icon" style={{ width: 48, height: 48 }}><Icon name="receipt" size={24} /></span>
            <div><h2>{expenseName}</h2><span className="tg-detail-amount">{expense?.getTotalAmountFormatted()}</span></div>
          </section>

          <div className="tg-page-content">
            <GroupedList>
              <div className="tg-detail-grid">
                <span>Paid by</span><strong>{expense?.getPaidByFirstAndLastName()}</strong>
                <span>Date</span><span>{fullDate(expense?.getCreatedAt() || '')}</span>
              </div>
            </GroupedList>

            <h2 className="tg-section-title">Participants</h2>
            <GroupedList>
              {debts.map(debt => {
                const name = debt.getFirstAndLastName();
                return <ListRow key={debt.getId()} avatar={<Avatar name={name} size="sm" />} title={name} value={debt.getDebtAmountFormatted()} />;
              })}
            </GroupedList>

            <div className="tg-sticky-action"><PrimaryButton destructive onClick={() => { setDeleteError(''); setDeleteDialogOpen(true); }}><Icon name="trash" size={18} /> Delete expense</PrimaryButton></div>
          </div>
        </>
      )}

      <Modal
        open={deleteDialogOpen}
        title="Delete expense?"
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        footer={<><PrimaryButton outline disabled={deleting} onClick={() => setDeleteDialogOpen(false)}>Cancel</PrimaryButton><PrimaryButton destructive disabled={deleting} onClick={performDelete}>{deleting ? 'Deleting…' : 'Delete'}</PrimaryButton></>}
      >
        <p>This expense and its participant balances will be removed.</p>
        {deleteError && <p className="tg-action-error">{deleteError}</p>}
      </Modal>
    </main>
  );
}
