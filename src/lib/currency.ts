export type Currency = "USD" | "AED";

/** Fixed reference rate: 1 USD = AED_PER_USD AED. All listing prices are stored in USD. */
export const AED_PER_USD = 3.6725;

export function convertFromUsd(usd: number, currency: Currency): number {
  return currency === "AED" ? usd * AED_PER_USD : usd;
}

export function convertToUsd(amount: number, currency: Currency): number {
  return currency === "AED" ? amount / AED_PER_USD : amount;
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
