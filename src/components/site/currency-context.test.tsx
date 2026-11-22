import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CurrencyProvider } from "./currency-context";

afterEach(() => {
  cleanup();
  vi.doUnmock("react");
});

it("keeps a reloaded currency consumer connected to the already-mounted provider", async () => {
  // Reload this module but keep the React runtime, matching browser hot reload.
  vi.resetModules();
  vi.doMock("react", () => React);
  const reloaded = await import("./currency-context");
  function ReloadedConsumer() {
    const { currency, price } = reloaded.useCurrency();
    return <output aria-label="Currency result">{currency} {price(1000)}</output>;
  }
  render(<CurrencyProvider><ReloadedConsumer /></CurrencyProvider>);
  expect(screen.getByLabelText("Currency result").textContent).toBe("USD $1,000");
});