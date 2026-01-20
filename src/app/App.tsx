import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes } from "react-router-dom";

import GroupList from "../pages/group/list.tsx";
import NewGroup from "../pages/group/new.tsx";
import GroupInfo from "../pages/group/info.tsx";
import GroupSetting from "../pages/group/setting.tsx";
import ExpenseInfo from "../pages/expense/info.tsx";
import NewExpense from "../pages/expense/new.tsx";

import { getCommand } from '../entities/upload/common.ts';

import './App.css';

import '@shoelace-style/shoelace/dist/themes/dark.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

import { TGroup } from '../entities/types/group/group.ts';
import { TGroupList } from '../entities/types/group/group_list.ts';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

export const GroupListContext = React.createContext(
  {
    groupList: new TGroupList(),
    setGroupList: (groupList: TGroupList) => {}
  }
);

export default function App() {

  const [groupList, setGroupList] = useState(new TGroupList());
  const groupListValue = useMemo(() => ({groupList, setGroupList}), [groupList]);

  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch(getCommand("groups/get_list"))

      const data = await response.json()
      console.log('Input data:', data)
      data.groups.forEach((item: any) => {
        const group = new TGroup(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4],
          item[5]
        );
        groupList.addItem(group);
      })
      setGroupList(new TGroupList(groupList.getItems()));
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="app" className="App">
      <GroupListContext.Provider value={groupListValue}>
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
      </GroupListContext.Provider>
    </div>
  );
}
