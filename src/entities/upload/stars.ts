import { getCommand, getRequestOptions } from "./common.ts";


export const createInvoiceLink = async (stars: number, days: number) => {
    const response = await fetch(getCommand("stars/create_invoice_link"), getRequestOptions(
        JSON.stringify(
            {
                stars: stars,
                days: days
            }
        ))
    );

    const data = await response.json();
    return data["invoice_link"];
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
