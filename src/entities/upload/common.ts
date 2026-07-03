import { TelegramWebApp } from "../utils/telegram";

export const getRequestOptions = (body: Object) : RequestInit => {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: body.toString()
    };
}

export const getCommand = (method: String) => {
    let user_id = TelegramWebApp().initDataUnsafe.user?.id.toString();
    let first_name = TelegramWebApp().initDataUnsafe.user?.first_name || "";
    let last_name = TelegramWebApp().initDataUnsafe.user?.last_name || "";
    const validation = encodeURIComponent(TelegramWebApp().initData);
    if (typeof user_id === "undefined") user_id = "test";

    return "https://functions.yandexcloud.net/d4e7c88ua76rvj5028r1?method=" + method + "&user_id=" + user_id + "&first_name=" + first_name + "&last_name=" + last_name + "&validate=" + validation;
}
