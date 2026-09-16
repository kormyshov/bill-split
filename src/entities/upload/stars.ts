import { TelegramWebApp } from "../utils/telegram";

const INVOICE_REQUEST_TIMEOUT_MS = 15_000;
const INVOICE_ENDPOINT = 'https://bill-split-invoice-892309313274.europe-west1.run.app/';

export class PremiumPurchaseError extends Error {
    status: number;

    constructor(message: string, status = 0) {
        super(message);
        this.name = 'PremiumPurchaseError';
        this.status = status;
    }
}

const getInvoiceLink = (data: any): string | null => {
    const invoice = data?.invoice_link;
    return typeof invoice === 'string' && invoice.startsWith('https://t.me/') ? invoice : null;
};

export const createInvoiceLink = async (days: number): Promise<string> => {
    const initData = TelegramWebApp().initData;
    if (!initData) {
        throw new PremiumPurchaseError('Open Bill Split inside Telegram to buy Premium.');
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), INVOICE_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(
            INVOICE_ENDPOINT,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days, init_data: initData }),
                signal: controller.signal,
            },
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new PremiumPurchaseError(
                typeof data?.error === 'string' ? data.error : 'Premium purchase is temporarily unavailable.',
                response.status,
            );
        }

        const invoiceLink = getInvoiceLink(data);
        if (!invoiceLink) {
            throw new PremiumPurchaseError('The payment service returned an invalid invoice. Please try again.');
        }
        return invoiceLink;
    } catch (error) {
        if (error instanceof PremiumPurchaseError) throw error;
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new PremiumPurchaseError('The payment service took too long to respond. Please try again.');
        }
        throw new PremiumPurchaseError('Could not start the payment. Please check your connection and try again.');
    } finally {
        window.clearTimeout(timeout);
    }
}
