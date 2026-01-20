import { TDebt } from "./debt.ts";


export class TDebtList {

    private items: Array<TDebt>;

    constructor();
    constructor(items: Array<TDebt>);
    constructor(...args: any[]) {
        if (args.length === 1) {
            this.items = args[0];
        } else {
            this.items = new Array<TDebt>();
        }
    }

    public getItems(): Array<TDebt> {
        return this.items;
    }

    public addItem(item: TDebt): void {
        this.items.push(item);
    }

}
