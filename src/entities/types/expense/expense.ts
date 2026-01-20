export class TExpense {
    
    private id: number;
    private name: string;
    private created_at: string;
    private first_and_last_name: string;
    private amount: number;
    private currency_symbol: string;
    
    constructor(id: number, name: string, created_at: string, first_and_last_name: string, amount: number, currency_symbol: string) {
        this.id = id;
        this.name = name;
        this.created_at = created_at;
        this.first_and_last_name = first_and_last_name;
        this.amount = amount;
        this.currency_symbol = currency_symbol;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getCreatedAt(): string {
        return this.created_at;
    }

    public getFirstAndLastName(): string {
        return this.first_and_last_name;
    }

    public getAmount(): number {
        return this.amount;
    }

    public getAmountFormatted(): string {
        return (this.amount / 100).toFixed(2) + ' ' + this.currency_symbol;
    }

    public getCurrencySymbol(): string {
        return this.currency_symbol;
    }

}