import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SlInput from '@shoelace-style/shoelace/dist/react/input';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlOption from '@shoelace-style/shoelace/dist/react/option';
import SlSelect from '@shoelace-style/shoelace/dist/react/select';
import SlTab from '@shoelace-style/shoelace/dist/react/tab';
import SlTabGroup from '@shoelace-style/shoelace/dist/react/tab-group';
import SlTabPanel from '@shoelace-style/shoelace/dist/react/tab-panel';
import SlCheckbox from '@shoelace-style/shoelace/dist/react/checkbox';

import { getCommand } from '../../entities/upload/common';
import { createEquallyExpense } from '../../entities/upload/expenses.ts';

import { TUser } from '../../entities/types/user/user';
import { TUserList } from '../../entities/types/user/user_list';
import { CURRENCIES } from '../../entities/data/currencies';


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

  const [checkedList, setCheckedList] = useState<number[]>(groupMembers.getItems().map((member) => member.getId()));

  const handleChangeCheck = (checked: boolean, user_id: number) => {
    if (checked) {
      setCheckedList([...checkedList, user_id]);
    } else {
      setCheckedList(checkedList.filter((id) => id !== user_id));
    }
  }

  const checkList = groupMembers
    .getItems()
    .map((member: TUser) => (
      <SlCheckbox

        onSlChange={(e) => {handleChangeCheck((e.target as HTMLInputElement).checked, member.getId())}}
        style={{ display: 'block', marginBottom: '0.5rem' }}
      >
        {member.getFirstName()} {member.getLastName()}
      </SlCheckbox>
    ))

  const currencyOptions = Object.entries(CURRENCIES).map(
    ([key, value]) => 
      <SlOption
        value={key}
        {...(key === expenseCurrency ? { selected: true } : { selected: false })}
      >
        {value}
      </SlOption>
  );

  const handleCreateEquallyExpense = () => {
    createEquallyExpense(groupId, expenseName, expenseAmount, expenseCurrency, checkedList);
    navigate('/groups/' + groupId);
  }

  return (
    <>
      <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/groups/' + groupId)} />
      <h1>Add expense</h1>
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

        <SlTabPanel name="equally">
            <h3>Select members involved in expense:</h3>
            <ul>
              {checkList}
            </ul>
            <SlButton 
              variant="success" 
              style={{ width: '100%', marginTop: '1rem' }} 
              onClick={()=>{handleCreateEquallyExpense()}}
              {...(checkedList.length === 0 ? { disabled: true } : { disabled: false })}
            >
              Split by {(expenseAmount / checkedList.length).toFixed(2)} {CURRENCIES[expenseCurrency]}
            </SlButton>
        </SlTabPanel>

        <SlTabPanel name="custom">To be continue</SlTabPanel>
      </SlTabGroup>

    </>
  );
}
