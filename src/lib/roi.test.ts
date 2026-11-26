import { describe, expect, it } from "vitest";
import { AED_PER_USD, convertFromUsd } from "./currency";
import { calculateIrr, calculateRoi, type RoiInput } from "./roi";

const baseInput: RoiInput = {
  purchasePriceUsd: 1_000_000,
  monthlyRentUsd: 10_000,
  annualServiceChargesUsd: 20_000,
  annualAppreciationPct: 3,
  downPaymentPct: 20,
  interestRatePct: 6,
  loanTermYears: 30,
  duringConstructionPct: 40,
  onHandoverPct: 40,
  handoverYears: 2,
};

describe("Yieldstone ROI calculations", () => {
  it("uses the exact USD/AED peg for converted outputs", () => {
    expect(AED_PER_USD).toBe(3.6725);
    expect(convertFromUsd(1_000_000, "AED")).toBe(3_672_500);
  });

  it("keeps ready-property rent, appreciation and mortgage payments active from Year 1", () => {
    const result = calculateRoi(baseInput, "ready");
    const firstYear = result.rows[0];
    expect(firstYear?.propertyValue).toBeCloseTo(1_030_000);
    expect(firstYear?.grossRent).toBe(120_000);
    expect(firstYear?.serviceCharges).toBe(20_000);
    expect(firstYear?.capitalOrDebtPayment).toBeCloseTo(57_556.85, 1);
    expect(result.initialCashOutflow).toBe(200_000);
    expect(result.handoverYears).toBe(0);
  });

  it("applies the default off-plan payments as 20% at Year 0, 40% across construction and 40% at handover", () => {
    const result = calculateRoi(baseInput, "off-plan");
    expect(result.paymentPlanTotalPct).toBe(100);
    expect(result.paymentPlanValid).toBe(true);
    expect(result.initialCashOutflow).toBe(200_000);
    expect(result.rows[0]?.capitalOrDebtPayment).toBe(200_000);
    expect(result.rows[1]?.capitalOrDebtPayment).toBe(600_000);
    expect(result.rows[2]?.capitalOrDebtPayment).toBe(0);
    expect(result.initialCashOutflow + result.rows.slice(0, 2).reduce((sum, row) => sum + row.capitalOrDebtPayment, 0)).toBe(1_000_000);
  });

  it("starts off-plan appreciation in Year 1 but rent and service charges only after the handover year", () => {
    const result = calculateRoi(baseInput, "off-plan");
    expect(result.rows[0]?.propertyValue).toBeCloseTo(1_030_000);
    expect(result.rows[1]?.grossRent).toBe(0);
    expect(result.rows[1]?.serviceCharges).toBe(0);
    expect(result.rows[2]?.grossRent).toBe(120_000);
    expect(result.rows[2]?.serviceCharges).toBe(20_000);
  });

  it("uses post-handover net rent and total planned cash for off-plan cash-on-cash", () => {
    const result = calculateRoi(baseInput, "off-plan");
    expect(result.cashOnCashPct).toBeCloseTo(10);
  });

  it("includes construction outflows and Year 10 sale proceeds in off-plan IRR cash flows", () => {
    const result = calculateRoi(baseInput, "off-plan");
    expect(result.irrCashFlows.slice(0, 4)).toEqual([-200_000, -200_000, -600_000, 100_000]);
    expect(result.irrCashFlows[10]).toBeCloseTo(100_000 + 1_000_000 * Math.pow(1.03, 10));
    expect(result.irrPct).not.toBeNull();
  });

  it("calculates a known 10% internal rate of return", () => {
    expect(calculateIrr([-1000, 0, 0, 1331])).toBeCloseTo(10, 6);
  });

  it("flags payment plans that do not total 100%", () => {
    const result = calculateRoi({ ...baseInput, onHandoverPct: 30 }, "off-plan");
    expect(result.paymentPlanTotalPct).toBe(90);
    expect(result.paymentPlanValid).toBe(false);
  });
});
