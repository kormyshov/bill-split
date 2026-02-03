export const formatAmount = (amount: number, symbol: string) : string => {
    return (amount / 100).toFixed(2) + ' ' + symbol;
}
