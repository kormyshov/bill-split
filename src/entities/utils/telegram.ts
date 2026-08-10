export const TelegramWebApp = () => {
    const telegram = (window as any).Telegram?.WebApp;

    if (telegram) return telegram;

    return {
        initData: '',
        initDataUnsafe: {},
        themeParams: {},
        colorScheme: 'light',
        ready: () => {},
        expand: () => {},
        setHeaderColor: () => {},
        setBackgroundColor: () => {},
        setBottomBarColor: () => {},
        onEvent: () => {},
        offEvent: () => {},
        BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
        HapticFeedback: {
            impactOccurred: () => {},
            notificationOccurred: () => {},
            selectionChanged: () => {},
        },
        openInvoice: () => {},
        showPopup: () => {},
    };
}

export const haptic = (kind: 'selection' | 'success' | 'warning' | 'error' = 'selection') => {
    const feedback = TelegramWebApp().HapticFeedback;
    if (!feedback) return;

    if (kind === 'selection') feedback.selectionChanged?.();
    else feedback.notificationOccurred?.(kind);
}
