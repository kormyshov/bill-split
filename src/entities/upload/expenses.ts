import { getCommand, getRequestOptions } from "./common.ts";


export const createEquallyExpense = (groupId: string, expenseName: string, expenseAmount: number, expenseCurrency: string, checkedList: number[]) => {
    fetch(getCommand("expenses/create_equally"), getRequestOptions(
        JSON.stringify(
            {
                group_id: groupId,
                expense_name: expenseName,
                expense_amount: expenseAmount,
                expense_currency: Number(expenseCurrency),
                user_ids: checkedList
            }
        ))
    );
}
