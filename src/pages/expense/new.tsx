import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlInput from '@shoelace-style/shoelace/dist/react/input';
import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlOption from '@shoelace-style/shoelace/dist/react/option';
import SlSelect from '@shoelace-style/shoelace/dist/react/select';
import SlTab from '@shoelace-style/shoelace/dist/react/tab';
import SlTabGroup from '@shoelace-style/shoelace/dist/react/tab-group';

import { getCommand } from '../../entities/upload/common';

import { ExpenseListContext } from '../../app/App';

import { TUser } from '../../entities/types/user/user';
import { TUserList } from '../../entities/types/user/user_list';
import { CURRENCIES } from '../../entities/data/currencies';
import EquallyExpenseTab from '../../widgets/tabs/equally_expense.tsx';
import CustomExpenseTab from '../../widgets/tabs/custom_expense.tsx';


export default function NewExpense() {

  const { groupId } = useParams() as { groupId: string };
  const navigate = useNavigate();

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);

  const [groupMembers, setGroupMembers] = useState(new TUserList());

  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch(getCommand("groups/get_member_list&group_id=" + groupId))

      const data = await response.json()
      console.log('Input member list:', data)
      data.group_members.forEach((item: any) => {
        const user = new TUser(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4]
        );
        groupMembers.addItem(user);
      })
      setGroupMembers(new TUserList(groupMembers.getItems()));
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { expenseList } = useContext(ExpenseListContext);
  const usedCurrencies = expenseList.getItems().map(expense => expense.getCurrencySymbol());

  const currencyOptions = Object.entries(CURRENCIES)
    .sort((a, b) => {
      if (usedCurrencies.indexOf(a[1]) === -1 && usedCurrencies.indexOf(b[1]) === -1) {
        return a[1].localeCompare(b[1]);
      }
      if (usedCurrencies.indexOf(a[1]) === -1) {
        return 1;
      }
      if (usedCurrencies.indexOf(b[1]) === -1) {
        return -1;
      }
      return usedCurrencies.indexOf(a[1]) - usedCurrencies.indexOf(b[1])
    })
    .map(
      ([key, value]) => 
        <SlOption
          value={key}
          {...(value === usedCurrencies[0] ? { selected: true } : { selected: false })}
        >
          {value}
        </SlOption>
    );

  const [expenseCurrency, setExpenseCurrency] = useState(currencyOptions[0].props.value as string);

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
      <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/groups/' + groupId)} />
      <h2>Add expense</h2>
      <SlInput
        placeholder="Expense name"
        value={expenseName}
        onSlInput={(e)=>setExpenseName((e.target as HTMLInputElement).value)}
        style={{ width: '100%', marginBottom: '1rem' }}
        autoFocus
      />
      <SlInput
        placeholder="Amount"
        type="number"
        min="0"
        value={expenseAmount.toString()}
        onSlInput={(e)=>setExpenseAmount(Number((e.target as HTMLInputElement).value))}
        style={{ width: '60%', marginBottom: '1rem', display: 'inline-block' }}
      />
      <SlSelect
        value={expenseCurrency}
        style={{ width: '40%', marginBottom: '1rem', display: 'inline-block' }}
        onSlChange={(e)=>setExpenseCurrency((e.target as HTMLSelectElement).value)}
      >
        {currencyOptions}
      </SlSelect>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
      <SlTabGroup
        {...(expenseName === '' || expenseAmount === 0 ? 
          { style:{ display: 'none' } } : 
          { style:{ display: 'block' } })
        }
      >
        <SlTab slot="nav" panel="equally">
          Equally
        </SlTab>
        <SlTab slot="nav" panel="custom">
          Custom
        </SlTab>

        <EquallyExpenseTab 
          groupId={groupId}
          groupMembers={groupMembers} 
          expenseName={expenseName} 
          expenseAmount={expenseAmount} 
          expenseCurrency={expenseCurrency} 
        />

        <CustomExpenseTab 
          groupId={groupId}
          groupMembers={groupMembers} 
          expenseName={expenseName}
          expenseAmount={expenseAmount}
          expenseCurrency={expenseCurrency}
        />
      </SlTabGroup>
      </div>
    </>
  );
}
