import { createContext, useContext, useEffect, useState, type Context, type ReactNode } from "react";
import type { Currency } from "@/lib/currency";
import { formatPriceFromUsd } from "@/lib/currency";

interface CurrencyCtx {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  price: (usd: number, opts?: { compact?: boolean }) => string;
}

// Preserve context identity when hot reload updates consumers without remounting the root provider.
const g = globalThis as typeof globalThis & { __atlasCurrencyCtx?: Context<CurrencyCtx | null> };
const Ctx = g.__atlasCurrencyCtx ?? (g.__atlasCurrencyCtx = createContext<CurrencyCtx | null>(null));
const KEY = "atlas-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "USD" || saved === "AED") setCurrencyState(saved);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem(KEY, c);
  };

  return (
    <Ctx.Provider
      value={{ currency, setCurrency, price: (usd, opts) => formatPriceFromUsd(usd, currency, opts) }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
