import React, { useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import GroupList from "../pages/group/list.tsx";
import NewGroup from "../pages/group/new.tsx";
import GroupInfo from "../pages/group/info.tsx";
import GroupSetting from "../pages/group/setting.tsx";
import ExpenseInfo from "../pages/expense/info.tsx";
import NewExpense from "../pages/expense/new.tsx";
import GroupSettle from "../pages/group/settle.tsx";
import Connect from "../pages/connect.tsx";
import AccountInfo from '../pages/account/info.tsx';
import NotFound from '../pages/not_found.tsx';

import './App.css';

import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

import { TGroupList } from '../entities/types/group/group_list.ts';
import { TExpenseList } from '../entities/types/expense/expense_list.ts';
import { TBalanceList } from '../entities/types/balance/balance_list.ts';
import { TUser } from '../entities/types/user/user.ts';
import { TUserList } from '../entities/types/user/user_list.ts';
import { TelegramWebApp } from '../entities/utils/telegram.ts';
import { getCommand } from '../entities/upload/common.ts';
import { TGroup } from '../entities/types/group/group.ts';

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

function TelegramRuntime() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const webApp = TelegramWebApp();
    const isTelegram = Boolean(webApp.initData);

    document.documentElement.classList.toggle('telegram-runtime', isTelegram);
    if (isTelegram) {
      webApp.ready?.();
      webApp.expand?.();

      try {
        webApp.setHeaderColor?.('bg_color');
        webApp.setBackgroundColor?.('bg_color');
        webApp.setBottomBarColor?.('bg_color');
      } catch (_) {
        // Older Telegram clients may not support every color method.
      }
    }

    return () => document.documentElement.classList.remove('telegram-runtime');
  }, []);

  useEffect(() => {
    const webApp = TelegramWebApp();
    if (!webApp.initData) return;
    const goBack = () => {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    };

    if (location.pathname === '/') {
      webApp.BackButton?.hide?.();
    } else {
      webApp.BackButton?.show?.();
      webApp.BackButton?.onClick?.(goBack);
    }

    return () => webApp.BackButton?.offClick?.(goBack);
  }, [location.pathname, navigate]);

  return null;
}

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

export const MemberListContext = React.createContext(
  {
    memberList: new TUserList(),
    setMemberList: (memberList: TUserList) => {}
  }
);

export const MemberUpdateFlagContext = React.createContext(
  {
    memberUpdateFlag: -1,
    setMemberUpdateFlag: (flag: number) => {}
  }
);

export const BalanceListContext = React.createContext(
  {
    balanceList: new TBalanceList(),
    setBalanceList: (balanceList: TBalanceList) => {}
  }
);

export const BalanceUpdateFlagContext = React.createContext(
  {
    balanceUpdateFlag: -1,
    setBalanceUpdateFlag: (flag: number) => {}
  }
);

export const AccountContext = React.createContext(
  {
    account: new TUser(-1, '', '', '', '', ''),
    setAccount: (account: TUser) => {}
  }
);

export const AccountUpdateFlagContext = React.createContext(
  {
    accountUpdateFlag: true,
    setAccountUpdateFlag: (flag: boolean) => {}
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

  const [memberList, setMemberList] = useState(new TUserList());
  const memberListValue = useMemo(() => ({memberList, setMemberList}), [memberList]);

  const [memberUpdateFlag, setMemberUpdateFlag] = useState(-1);
  const memberUpdateFlagValue = useMemo(() => ({memberUpdateFlag, setMemberUpdateFlag}), [memberUpdateFlag]);

  const [balanceList, setBalanceList] = useState(new TBalanceList());
  const balanceListValue = useMemo(() => ({balanceList, setBalanceList}), [balanceList]);

  const [balanceUpdateFlag, setBalanceUpdateFlag] = useState(-1);
  const balanceUpdateFlagValue = useMemo(() => ({balanceUpdateFlag, setBalanceUpdateFlag}), [balanceUpdateFlag]);

  const [account, setAccount] = useState(new TUser(-1, '', '', '', '', ''));
  const accountValue = useMemo(() => ({account, setAccount}), [account]);

  const [accountUpdateFlag, setAccountUpdateFlag] = useState(true);
  const accountUpdateFlagValue = useMemo(() => ({accountUpdateFlag, setAccountUpdateFlag}), [accountUpdateFlag]);

  useEffect(() => {
    if (!groupUpdateFlag) return;

    const fetchGroups = async () => {
      try {
        const response = await fetch(getCommand('groups/get_list'));
        const data = await response.json();
        const groups = new TGroupList();
        data.groups.forEach((item: any) => groups.addItem(new TGroup(item[0], item[1], item[2], item[3], item[4], item[5])));
        setGroupList(groups);
      } finally {
        setGroupUpdateFlag(false);
      }
    };

    fetchGroups();
  }, [groupUpdateFlag]);

  useEffect(() => {
    if (!accountUpdateFlag) return;

    const fetchAccount = async () => {
      try {
        const response = await fetch(getCommand('account/get_info'));
        const data = await response.json();
        setAccount(new TUser(data.account[0], data.account[1], data.account[2], data.account[3], data.account[4], data.account[5]));
      } finally {
        setAccountUpdateFlag(false);
      }
    };

    fetchAccount();
  }, [accountUpdateFlag]);

  return (
    <div id="app" className="App">
      <GroupListContext.Provider value={groupListValue}>
      <GroupUpdateFlagContext.Provider value={groupUpdateFlagValue}>
      <ExpenseListContext.Provider value={expenseListValue}>
      <ExpenseUpdateFlagContext.Provider value={expenseUpdateFlagValue}>
      <MemberListContext.Provider value={memberListValue}>
      <MemberUpdateFlagContext.Provider value={memberUpdateFlagValue}>
      <BalanceListContext.Provider value={balanceListValue}>
      <BalanceUpdateFlagContext.Provider value={balanceUpdateFlagValue}>
      <AccountContext.Provider value={accountValue}>
      <AccountUpdateFlagContext.Provider value={accountUpdateFlagValue}>
        <TelegramRuntime />
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
            <Route path=":groupId/settle" element={<GroupSettle />} />
          </Route>
          <Route path="account">
            <Route path="info" element={<AccountInfo />} />
          </Route>
          <Route path="connect/:token" element={<Connect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AccountUpdateFlagContext.Provider>
      </AccountContext.Provider>
      </BalanceUpdateFlagContext.Provider>
      </BalanceListContext.Provider>
      </MemberUpdateFlagContext.Provider>
      </MemberListContext.Provider>
      </ExpenseUpdateFlagContext.Provider>
      </ExpenseListContext.Provider>
      </GroupUpdateFlagContext.Provider>
      </GroupListContext.Provider>
    </div>
  );
}
