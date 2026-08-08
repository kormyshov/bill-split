export class TUser {
    
    private id: number;
    private telegram_id: string;
    private first_name: string;
    private last_name: string;
    private expired_date: string;
    private phone: string;
    
    constructor(id: number, telegram_id: string, first_name: string, last_name: string, expired_date: string, phone: string) {
        this.id = id;
        this.telegram_id = telegram_id;
        this.first_name = first_name;
        this.last_name = last_name;
        this.expired_date = expired_date;
        this.phone = phone;
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

    public getExpiredDate(): string {
        return this.expired_date;
    }

    public getPhone(): string {
        return this.phone;
    }

    public isPremium(): boolean {
        const currentDate = new Date();
        const expiredDate = new Date(this.expired_date);
        return expiredDate >= currentDate;
    }

}
