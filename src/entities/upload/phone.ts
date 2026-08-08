import { getCommand, getRequestOptions } from "./common.ts";


export const setPhone = (phone: string) => {
    return fetch(getCommand("phone/set"), getRequestOptions(
        JSON.stringify({ phone: phone })
    ));
}

export const deletePhone = () => {
    return fetch(getCommand("phone/delete"), { method: 'POST' });
}
