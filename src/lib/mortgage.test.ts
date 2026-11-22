import { describe, expect, it } from "vitest";
import { calculateMortgage, monthlyPrincipalAndInterest } from "./mortgage";
import { convertFromUsd, convertToUsd } from "./currency";

describe("mortgage", () => {
  it("computes the standard monthly payment for a 30-year loan at 6%", () => {
    expect(monthlyPrincipalAndInterest(400_000, 6, 30)).toBeCloseTo(2398.2, 1);
  });

  it("splits evenly when the interest rate is 0%", () => {
    expect(monthlyPrincipalAndInterest(120_000, 0, 10)).toBeCloseTo(1000, 6);
  });

  it("subtracts the down payment and adds tax and insurance to the monthly total", () => {
    const r = calculateMortgage({
      homePrice: 500_000,
      downPayment: 100_000,
      annualRatePct: 6,
      years: 30,
      propertyTaxPct: 1.2,
      insurancePerYear: 1200,
    });
    expect(r.loanAmount).toBe(400_000);
    expect(r.monthlyTotal).toBeCloseTo(2398.2 + 500 + 100, 1);
    expect(r.schedule.at(-1)?.balance).toBeCloseTo(0, 2);
  });
});

describe("currency", () => {
  it("converts USD to AED at the fixed 3.6725 rate and back", () => {
    expect(convertFromUsd(1000, "AED")).toBeCloseTo(3672.5);
    expect(convertToUsd(3672.5, "AED")).toBeCloseTo(1000);
    expect(convertFromUsd(1000, "USD")).toBe(1000);
  });
});
