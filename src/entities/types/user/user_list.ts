import { TUser } from "./user.ts";


export class TUserList {

    private items: Array<TUser>;

    constructor();
    constructor(items: Array<TUser>);
    constructor(...args: any[]) {
        if (args.length === 1) {
            this.items = args[0];
        } else {
            this.items = new Array<TUser>();
        }
    }

    public getItems(): Array<TUser> {
        return this.items;
    }

    public addItem(item: TUser): void {
        this.items.push(item);
    }

}
