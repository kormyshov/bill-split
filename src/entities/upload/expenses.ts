import { getCommand, getRequestOptions } from "./common.ts";


export const createEquallyExpense = (groupId: string, expenseName: string, expenseAmount: number, expenseCurrency: string, payer_id: string, checkedList: number[]) => {
    fetch(getCommand("expenses/create_equally"), getRequestOptions(
        JSON.stringify(
            {
                group_id: groupId,
                expense_name: expenseName,
                expense_amount: expenseAmount,
                expense_currency: Number(expenseCurrency),
                payer_id: Number(payer_id),
                user_ids: checkedList
            }
        ))
    );
}

export const createCustomExpense = (groupId: string, expenseName: string, expenseAmount: number, expenseCurrency: string, payer_id: string, totals: any[]) => {
    fetch(getCommand("expenses/create_custom"), getRequestOptions(
        JSON.stringify(
            {
                group_id: groupId,
                expense_name: expenseName,
                expense_amount: expenseAmount,
                expense_currency: Number(expenseCurrency),
                payer_id: Number(payer_id),
                totals: totals
            }
        ))
    );
}

export const createDirectExpense = (groupId: string, amount: number, currency: number, user_id: number, first_and_last_name: string) => {
    fetch(getCommand("expenses/create_direct"), getRequestOptions(
        JSON.stringify(
            {
                group_id: groupId,
                amount: amount,
                currency: currency,
                user_id: user_id,
                first_and_last_name: first_and_last_name
            }
        ))
    );
}

export const deleteExpense = (expenseId: number) => {
    fetch(getCommand("expenses/delete"), getRequestOptions(expenseId));
}
