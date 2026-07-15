import { getCommand, getRequestOptions } from "./common.ts";

export const getRates = (currencyId: number) => {
  return fetch(
    getCommand("rates/get_rates"),
    getRequestOptions(JSON.stringify({ currency_id: currencyId }))
  );
};
