import React from 'react';

import { CURRENCIES } from '../entities/data/currencies';


export default function TotalsTable(props: any) {

  const membsers = props.totals
    .map((item: any) => props.groupMembers.getItemById(item.memberId).getFirstName() + ' ' + props.groupMembers.getItemById(item.memberId).getLastName())
    .map((name: string) => <span style={{ display: 'block' }}>{name} </span>);

  const totals = props.totals
    .map((item: any) => item.total)
    .map((total: number) => <span style={{ display: 'block' }}>{total.toFixed(2)} {CURRENCIES[props.expenseCurrency]} </span>);

  return (
    <>
      <div>
        <div style={{ float: 'left', paddingLeft: '1rem' }}>
          {membsers}  
        </div>
        <div style={{ float: 'right', paddingRight: '1rem' }}>
          {totals}
        </div>
      </div>
    </>
  );
}
