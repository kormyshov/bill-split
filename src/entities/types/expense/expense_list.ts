import { TExpense } from "./expense.ts";


export class TExpenseList {

    private items: Array<TExpense>;

    constructor();
    constructor(items: Array<TExpense>);
    constructor(...args: any[]) {
        if (args.length === 1) {
            this.items = args[0];
        } else {
            this.items = new Array<TExpense>();
        }
    }

    public getItems(): Array<TExpense> {
        return this.items.sort((a, b) => (a.getCreatedAt() > b.getCreatedAt()) ? -1 : ((b.getCreatedAt() > a.getCreatedAt()) ? 1 : 0));
    }

    public addItem(item: TExpense): void {
        this.items.push(item);
    }

}
