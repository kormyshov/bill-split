import { formatAmount } from "../../utils/common";

export class TBalance {
    
    private user_id: number;
    private currency: number;
    private amount: number;
    private currency_symbol: string;
    private first_and_last_name: string;
    
    constructor(user_id: number, currency: number, amount: number, currency_symbol: string, first_and_last_name: string) {
        this.user_id = user_id;
        this.currency = currency;
        this.amount = amount;
        this.currency_symbol = currency_symbol;
        this.first_and_last_name = first_and_last_name;
    }

    public getUserId(): number {
        return this.user_id;
    }

    public getCurrency(): number {
        return this.currency;
    }

    public getAmount(): number {
        return this.amount;
    }

    public getCurrencySymbol(): string {
        return this.currency_symbol;
    }

    public getFirstAndLastName(): string {
        return this.first_and_last_name;
    }

    public getAmountFormatted(): string {
        return formatAmount(this.amount, this.currency_symbol);
    }

}