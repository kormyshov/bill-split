import { TGroup } from "./group.ts";


export class TGroupList {

    private items: Array<TGroup>;

    constructor();
    constructor(items: Array<TGroup>);
    constructor(...args: any[]) {
        if (args.length === 1) {
            this.items = args[0];
        } else {
            this.items = new Array<TGroup>();
        }
    }

    public getItems(): Array<TGroup> {
        return this.items.sort((a, b) => (a.getCreatedAt() > b.getCreatedAt()) ? -1 : ((b.getCreatedAt() > a.getCreatedAt()) ? 1 : 0));
    }

    public addItem(item: TGroup): void {
        this.items.push(item);
    }

    public getItemById(id: number): TGroup | null {
        for (const item of this.items) {
            if (item.getId() === id) {
                return item;
            }
        }
        return null;
    }

    public containsToken(token: string): boolean {
        for (const item of this.items) {
            if (item.getToken() === token) {
                return true;
            }
        }
        return false;
    }
}
