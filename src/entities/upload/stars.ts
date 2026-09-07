import { getCommand, getRequestOptions } from "./common.ts";

const INVOICE_REQUEST_TIMEOUT_MS = 15_000;

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
    if (typeof invoice !== 'string') return null;

    if (invoice.startsWith('https://t.me/')) return invoice;

    try {
        const telegramResponse = JSON.parse(invoice);
        return telegramResponse?.ok === true && typeof telegramResponse.result === 'string'
            ? telegramResponse.result
            : null;
    } catch (_) {
        return null;
    }
};


export const createInvoiceLink = async (stars: number, days: number): Promise<string> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), INVOICE_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(
            getCommand("stars/create_invoice_link"),
            {
                ...getRequestOptions(JSON.stringify({ stars, days })),
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

export const paidPremium = (days: number) => {
    fetch(getCommand("stars/paid_premium"), getRequestOptions(
        JSON.stringify(
            {
                days: days
            }
        ))
    );
}
