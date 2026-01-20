export class TDebt {
    
    private id: number;
    private expense_name: string;
    private created_at: string;
    private total_amount: number;
    private currency_symbol: string;
    private paid_by_first_and_last_name: string;
    private debt_amount: number;
    private first_and_last_name: string;

    
    constructor(
        id: number, 
        expense_name: string, 
        created_at: string,
        total_amount: number, 
        currency_symbol: string, 
        paid_by_first_and_last_name: string,
        debt_amount: number,
        first_and_last_name: string
    ) {
        this.id = id;
        this.expense_name = expense_name;
        this.created_at = created_at;
        this.total_amount = total_amount;
        this.currency_symbol = currency_symbol;
        this.paid_by_first_and_last_name = paid_by_first_and_last_name;
        this.debt_amount = debt_amount;
        this.first_and_last_name = first_and_last_name;
    }

    public getId(): number {
        return this.id;
    }

    public getExpenseName(): string {
        return this.expense_name;
    }

    public getCreatedAt(): string {
        return this.created_at;
    }

    public getPaidByFirstAndLastName(): string {
        return this.paid_by_first_and_last_name;
    }

    public getDebtAmount(): number {
        return this.debt_amount;
    }

    public getFirstAndLastName(): string {
        return this.first_and_last_name;
    }

    public getTotalAmount(): number {
        return this.total_amount;
    }

    public getTotalAmountFormatted(): string {
        return (this.total_amount / 100).toFixed(2) + ' ' + this.currency_symbol;
    }
    
    public getDebtAmountFormatted(): string {
        return (this.debt_amount / 100).toFixed(2) + ' ' + this.currency_symbol;
    }

    public getCurrencySymbol(): string {
        return this.currency_symbol;
    }

}