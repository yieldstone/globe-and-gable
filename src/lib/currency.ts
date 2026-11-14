export type Currency = "USD" | "EUR";

/** Fixed reference rate: 1 USD = EUR_PER_USD EUR. All listing prices are stored in USD. */
export const EUR_PER_USD = 0.92;

export function convertFromUsd(usd: number, currency: Currency): number {
  return currency === "EUR" ? usd * EUR_PER_USD : usd;
}

export function convertToUsd(amount: number, currency: Currency): number {
  return currency === "EUR" ? amount / EUR_PER_USD : amount;
}

export function formatMoney(amount: number, currency: Currency, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: opts?.compact ? "compact" : "standard",
  }).format(amount);
}

export function formatPriceFromUsd(usd: number, currency: Currency, opts?: { compact?: boolean }) {
  return formatMoney(convertFromUsd(usd, currency), currency, opts);
}
