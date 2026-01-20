export class TUser {
    
    private id: number;
    private telegram_id: string;
    private first_name: string;
    private last_name: string;
    
    constructor(id: number, telegram_id: string, first_name: string, last_name: string) {
        this.id = id;
        this.telegram_id = telegram_id;
        this.first_name = first_name;
        this.last_name = last_name;
    }

    public getId(): number {
        return this.id;
    }

    public getTelegramId(): string {
        return this.telegram_id;
    }

    public getFirstName(): string {
        return this.first_name;
    }

    public getLastName(): string {
        return this.last_name;
    }

}