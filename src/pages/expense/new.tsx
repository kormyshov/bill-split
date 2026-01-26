import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlInput from '@shoelace-style/shoelace/dist/react/input';
import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlOption from '@shoelace-style/shoelace/dist/react/option';
import SlSelect from '@shoelace-style/shoelace/dist/react/select';
import SlTab from '@shoelace-style/shoelace/dist/react/tab';
import SlTabGroup from '@shoelace-style/shoelace/dist/react/tab-group';
import SlTabPanel from '@shoelace-style/shoelace/dist/react/tab-panel';

import { getCommand } from '../../entities/upload/common';

import { TUser } from '../../entities/types/user/user';
import { TUserList } from '../../entities/types/user/user_list';
import { CURRENCIES } from '../../entities/data/currencies';
import EquallyExpenseTab from '../../widgets/tabs/equally_expense.tsx';


export default function NewExpense() {

  const { groupId } = useParams() as { groupId: string };
  const navigate = useNavigate();

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCurrency, setExpenseCurrency] = useState('1');

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
          item[3]
        );
        groupMembers.addItem(user);
      })
      setGroupMembers(new TUserList(groupMembers.getItems()));
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currencyOptions = Object.entries(CURRENCIES).map(
    ([key, value]) => 
      <SlOption
        value={key}
        {...(key === expenseCurrency ? { selected: true } : { selected: false })}
      >
        {value}
      </SlOption>
  );


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
        value="1"
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

        <SlTabPanel name="custom">To be continue</SlTabPanel>
      </SlTabGroup>
      </div>
    </>
  );
}
