import { TBalance } from "./balance.ts";


export class TBalanceList {

    private items: Array<TBalance>;

    constructor();
    constructor(items: Array<TBalance>);
    constructor(...args: any[]) {
        if (args.length === 1) {
            this.items = args[0];
        } else {
            this.items = new Array<TBalance>();
        }
    }

    public getItems(): Array<TBalance> {
        return this.items;
    }

    public addItem(item: TBalance): void {
        this.items.push(item);
    }

    public clear(): void {
        this.items = new Array<TBalance>();
    }
}
