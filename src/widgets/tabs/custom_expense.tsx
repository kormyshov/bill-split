import React, { useContext, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';

import { BalanceUpdateFlagContext, ExpenseUpdateFlagContext } from '../../app/App';
import { TUser } from '../../entities/types/user/user';
import { TUserList } from '../../entities/types/user/user_list';
import { createCustomExpense } from '../../entities/upload/expenses';
import { CURRENCIES } from '../../entities/data/currencies';
import { haptic } from '../../entities/utils/telegram';
import { Avatar, GroupedList, Icon, ListRow, PrimaryButton, personName } from '../telegram-ui';

export type ReceiptPosition = { id: string; name: string; nameEn?: string; amount: number; memberId: number };

type CustomExpenseProps = {
  groupId: string;
  groupMembers: TUserList;
  expenseName: string;
  expenseAmount: number;
  expenseCurrency: string;
  payerId: string;
  positions: ReceiptPosition[];
  setPositions: Dispatch<SetStateAction<ReceiptPosition[]>>;
};

export default function CustomExpenseTab(props: CustomExpenseProps) {
  const navigate = useNavigate();
  const { setExpenseUpdateFlag } = useContext(ExpenseUpdateFlagContext);
  const { setBalanceUpdateFlag } = useContext(BalanceUpdateFlagContext);
  const members: TUser[] = props.groupMembers.getItems();
  const { positions, setPositions } = props;
  const [splitRestOption, setSplitRestOption] = useState<'all' | 'active'>('all');
  const [showTranslations, setShowTranslations] = useState(false);

  const positionTotal = positions.reduce((sum, position) => sum + position.amount, 0);
  const remaining = Number((props.expenseAmount - positionTotal).toFixed(2));
  const validPositions = positions.length > 0 && positions.every(position => position.amount > 0 && position.memberId !== -1) && remaining >= 0;
  const hasTranslations = positions.some(position => position.nameEn && position.nameEn.localeCompare(position.name, undefined, { sensitivity: 'base' }) !== 0);
  const activeMemberIds = Array.from(new Set(positions.filter(position => position.memberId !== -1).map(position => position.memberId)));

  const totals = useMemo(() => members.map(member => {
    const assigned = positions.filter(position => position.memberId === member.getId()).reduce((sum, position) => sum + position.amount, 0);
    let rest = 0;
    if (remaining > 0 && validPositions) {
      if (splitRestOption === 'all') rest = remaining / members.length;
      else if (activeMemberIds.includes(member.getId())) rest = remaining / activeMemberIds.length;
    }
    return { memberId: member.getId(), total: assigned + rest };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total), [activeMemberIds, members, positions, remaining, splitRestOption, validPositions]);

  const updatePosition = (index: number, patch: Partial<ReceiptPosition>) => setPositions(current => current.map((position, positionIndex) => positionIndex === index ? { ...position, ...patch } : position));
  const removePosition = (index: number) => setPositions(current => current.filter((_, positionIndex) => positionIndex !== index));

  const save = () => {
    if (!validPositions || !props.expenseName || !props.payerId) return;
    createCustomExpense(props.groupId, props.expenseName, props.expenseAmount, props.expenseCurrency, props.payerId, totals);
    setExpenseUpdateFlag(-1);
    setBalanceUpdateFlag(-1);
    haptic('success');
    navigate(`/groups/${props.groupId}`);
  };

  return (
    <div className="tg-custom-split">
      <div className="tg-section-title-row">
        <h2 className="tg-section-title">Items from the receipt</h2>
        {hasTranslations && (
          <button
            type="button"
            className={`tg-translation-toggle ${showTranslations ? 'is-active' : ''}`}
            aria-pressed={showTranslations}
            aria-label={`${showTranslations ? 'Hide' : 'Show'} English translations`}
            onClick={() => {
              setShowTranslations(current => !current);
              haptic('selection');
            }}
          >
            <span className="tg-translation-toggle-track" aria-hidden="true"><span /></span>
            English
          </button>
        )}
      </div>
      {positions.length > 0 && (
        <GroupedList>
          {positions.map((position, index) => (
            <div className="tg-receipt-row" key={position.id}>
              <div className="tg-receipt-name">
                <input
                  className="tg-receipt-name-input"
                  value={showTranslations && position.nameEn ? position.nameEn : position.name}
                  placeholder={`Item ${index + 1}`}
                  onChange={event => updatePosition(index, showTranslations && position.nameEn ? { nameEn: event.target.value } : { name: event.target.value })}
                  aria-label={`Name for item ${index + 1}`}
                />
              </div>
              <input className="tg-number-input" type="number" min="0" step="0.01" value={position.amount || ''} placeholder="0.00" onChange={event => updatePosition(index, { amount: Number(event.target.value) })} aria-label={`Amount for item ${index + 1}`} />
              <select className="tg-member-select" value={position.memberId} onChange={event => updatePosition(index, { memberId: Number(event.target.value) })} aria-label={`Member for item ${index + 1}`}>
                <option value={-1}>Choose member</option>
                {members.map(member => <option key={member.getId()} value={member.getId()}>{personName(member.getFirstName(), member.getLastName())}</option>)}
              </select>
              <button type="button" className="tg-icon-button is-destructive" onClick={() => removePosition(index)} aria-label={`Remove item ${index + 1}`}><Icon name="trash" size={17} /></button>
            </div>
          ))}
        </GroupedList>
      )}

      <button type="button" className="tg-add-item-button" onClick={() => setPositions(current => [...current, { id: `manual-${Date.now()}-${current.length}`, name: '', amount: 0, memberId: -1 }])}><Icon name="plus" size={16} /> Add receipt item</button>

      {positions.length > 0 && remaining < 0 && (
        <p className="tg-scan-error" role="alert">Items exceed the expense total by {Math.abs(remaining).toFixed(2)} {CURRENCIES[props.expenseCurrency]}. Adjust the total or item amounts.</p>
      )}

      {validPositions && remaining > 0 && (
        <>
          <h2 className="tg-section-title">Split the remaining {remaining.toFixed(2)} {CURRENCIES[props.expenseCurrency]}</h2>
          <div className="tg-choice-row">
            <button type="button" className={splitRestOption === 'all' ? 'is-active' : ''} onClick={() => setSplitRestOption('all')}>All members</button>
            <button type="button" className={splitRestOption === 'active' ? 'is-active' : ''} onClick={() => setSplitRestOption('active')}>Assigned members</button>
          </div>
        </>
      )}

      {validPositions && (
        <>
          <h2 className="tg-section-title">Totals</h2>
          <GroupedList>
            {totals.map(item => {
              const member = props.groupMembers.getItemById(item.memberId);
              const name = personName(member.getFirstName(), member.getLastName());
              return <ListRow key={item.memberId} avatar={<Avatar name={name} size="sm" />} title={name} value={`${item.total.toFixed(2)} ${CURRENCIES[props.expenseCurrency]}`} />;
            })}
          </GroupedList>
        </>
      )}

      <div className="tg-sticky-action"><PrimaryButton disabled={!validPositions || !props.expenseName || !props.payerId} onClick={save}>Split expense</PrimaryButton></div>
    </div>
  );
}
