import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlTabPanel from '@shoelace-style/shoelace/dist/react/tab-panel';
import SlRadioGroup from '@shoelace-style/shoelace/dist/react/radio-group';
import SlRadio from '@shoelace-style/shoelace/dist/react/radio';

import { TUser } from '../../entities/types/user/user';
import { createCustomExpense } from '../../entities/upload/expenses.ts';
import CheckPosition from '../check_position';
import TotalsTable from '../totals_table.tsx';


export default function CustomExpenseTab(props: any) {

  const navigate = useNavigate();

  const [positions, setPositions] = useState<any[]>([]);
  const [splitRestOption, setSplitRestOption] = useState('all');

  const handleAddPosition = () => {
    setPositions([...positions, {amount: 0, memberId: -1}]);
  }

  const handleDebtAmountChange = (index: number, amount: number) => {
    positions[index].amount = amount;
    setPositions([...positions]);
  }

  const handleDebtMemberChange = (index: number, memberId: number) => {
    positions[index].memberId = memberId;
    setPositions([...positions]);
  }

  const handleDeletePosition = (index: number) => {
    positions.splice(index, 1);
    setPositions([...positions]);
  }

  const handleCreateCustomExpense = () => {
    createCustomExpense(
      props.groupId,
      props.expenseName, 
      props.expenseAmount, 
      props.expenseCurrency, 
      totals
    );
    navigate('/groups/' + props.groupId);
  }

  const totals = props.groupMembers.getItems()
    .map((member: TUser) => member.getId())
    .map((memberId: number) => {
      return {
        memberId: memberId,
        total: positions
          .filter((pos) => pos.memberId === memberId)
          .reduce((acc, pos) => acc + pos.amount, 0)
          + (props.expenseAmount - positions.reduce((acc, pos) => acc + pos.amount, 0) > 0 ?
              (splitRestOption === 'all' ?
                (props.expenseAmount - positions.reduce((acc, pos) => acc + pos.amount, 0)) / props.groupMembers.getItems().length
              :
                (props.expenseAmount - positions.reduce((acc, pos) => acc + pos.amount, 0)) / (new Set(positions.map((pos) => pos.memberId))).size * Number(positions.filter((pos) => pos.memberId === memberId).length > 0)
              )
            : 0)
      }
    })
    .filter((item: any) => item.total > 0)
    .sort((a: any, b: any) => b.total - a.total);

  return (
    <>
      <SlTabPanel name="custom">
        <h3>Add positions from the bill:</h3>

        {positions.map((pos, index) => (
          <CheckPosition 
            groupMembers={props.groupMembers} 
            index={index}
            handleDebtAmountChange={handleDebtAmountChange}
            handleDebtMemberChange={handleDebtMemberChange}
            handleDeletePosition={handleDeletePosition}
            amount={pos.amount}
            memberId={pos.memberId}
          />
        ))}
        
        <SlButton 
          variant="primary" 
          style={{ width: '100%' }} 
          onClick={()=>handleAddPosition()}
        >
          Add position
        </SlButton>

        <div
          {...(props.expenseAmount - positions.reduce((acc, pos) => acc + pos.amount, 0) > 0 && 
            positions.every((pos) => pos.memberId !== -1) && 
            positions.length > 0
            ? 
            { style:{ display: 'block' } } : 
            { style:{ display: 'none' } })
          }
        >
          <h3>Split the rest equally among</h3>
          <SlRadioGroup 
            value={splitRestOption}
            onSlChange={(e)=>setSplitRestOption((e.target as HTMLInputElement).value)}
          >
            <SlRadio value="all" style={{ marginBottom: '0.5rem' }}>all members</SlRadio>
            <SlRadio value="active">all paying participants</SlRadio>
          </SlRadioGroup>
        </div>

        <div
          {...(props.expenseAmount - positions.reduce((acc, pos) => acc + pos.amount, 0) >= 0 &&
            positions.every((pos) => pos.memberId !== -1) && 
            positions.length > 0
            ? 
            { style:{ display: 'block' } } : 
            { style:{ display: 'none' } })
          }
        >
          <h3 style={{ marginTop: '2rem' }}>Totals:</h3>
          <TotalsTable 
            groupMembers={props.groupMembers}
            expenseCurrency={props.expenseCurrency}
            totals={totals}
          />
          <SlButton 
            variant="success" 
            style={{ width: '100%', marginTop: '1rem' }} 
            onClick={()=>{handleCreateCustomExpense()}}
          >
            Split expense
          </SlButton>
        </div>

      </SlTabPanel>
    </>
  );
}
