import React, { useMemo, useState } from 'react';
import { Route, Routes } from "react-router-dom";

import GroupList from "../pages/group/list.tsx";
import NewGroup from "../pages/group/new.tsx";
import GroupInfo from "../pages/group/info.tsx";
import GroupSetting from "../pages/group/setting.tsx";
import ExpenseInfo from "../pages/expense/info.tsx";
import NewExpense from "../pages/expense/new.tsx";

import './App.css';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

import { TGroupList } from '../entities/types/group/group_list.ts';
import { TExpenseList } from '../entities/types/expense/expense_list.ts';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

export const GroupListContext = React.createContext(
  {
    groupList: new TGroupList(),
    setGroupList: (groupList: TGroupList) => {}
  }
);

export const GroupUpdateFlagContext = React.createContext(
  {
    groupUpdateFlag: true,
    setGroupUpdateFlag: (flag: boolean) => {}
  }
);

export const ExpenseListContext = React.createContext(
  {
    expenseList: new TExpenseList(),
    setExpenseList: (expenseList: TExpenseList) => {}
  }
);

export const ExpenseUpdateFlagContext = React.createContext(
  {
    expenseUpdateFlag: -1,
    setExpenseUpdateFlag: (flag: number) => {}
  }
);

export default function App() {

  const [groupList, setGroupList] = useState(new TGroupList());
  const groupListValue = useMemo(() => ({groupList, setGroupList}), [groupList]);

  const [groupUpdateFlag, setGroupUpdateFlag] = useState(true);
  const groupUpdateFlagValue = useMemo(() => ({groupUpdateFlag, setGroupUpdateFlag}), [groupUpdateFlag]);

  const [expenseList, setExpenseList] = useState(new TExpenseList());
  const expenseListValue = useMemo(() => ({expenseList, setExpenseList}), [expenseList]);

  const [expenseUpdateFlag, setExpenseUpdateFlag] = useState(-1);
  const expenseUpdateFlagValue = useMemo(() => ({expenseUpdateFlag, setExpenseUpdateFlag}), [expenseUpdateFlag]);

  return (
    <div id="app" className="App">
      <GroupListContext.Provider value={groupListValue}>
      <GroupUpdateFlagContext.Provider value={groupUpdateFlagValue}>
      <ExpenseListContext.Provider value={expenseListValue}>
      <ExpenseUpdateFlagContext.Provider value={expenseUpdateFlagValue}>
        <Routes>
          <Route index element={<GroupList />} />
          <Route path="/">
            <Route index element={<GroupList/>} />
          </Route>
          <Route path="groups">
            <Route path="new" element={<NewGroup />} />
            <Route path=":groupId" element={<GroupInfo />} />
            <Route path=":groupId/settings" element={<GroupSetting />} />
            <Route path=":groupId/expenses/:expenseId" element={<ExpenseInfo />} />
            <Route path=":groupId/new_expense" element={<NewExpense />} />
          </Route>
        </Routes>
      </ExpenseUpdateFlagContext.Provider>
      </ExpenseListContext.Provider>
      </GroupUpdateFlagContext.Provider>
      </GroupListContext.Provider>
    </div>
  );
}
