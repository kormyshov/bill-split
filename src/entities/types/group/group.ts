export class TGroup {
    
    private id: number;
    private name: string;
    private created_at: string;
    private created_by: number;
    private count: number;
    private token: string;
    
    constructor(id: number, name: string, created_at: string, created_by: number, count: number, token: string) {
        this.id = id;
        this.name = name;
        this.created_at = created_at;
        this.created_by = created_by;
        this.count = count;
        this.token = token;
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

    public getCreatedBy(): number {
        return this.created_by;
    }

    public getCount(): number {
        return this.count;
    }

    public getToken(): string {
        return this.token;
    }

}