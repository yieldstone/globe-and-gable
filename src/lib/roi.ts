import { calculateMortgage } from "./mortgage";

export const ROI_PROJECTION_YEARS = 10;

export type RoiMarket = "USA" | "Dubai" | "Abu Dhabi";
export type RoiPropertyMode = "ready" | "off-plan";

export interface RoiInput {
  purchasePriceUsd: number;
  monthlyRentUsd: number;
  annualServiceChargesUsd: number;
  annualAppreciationPct: number;
  downPaymentPct: number;
  interestRatePct: number;
  loanTermYears: number;
  duringConstructionPct: number;
  onHandoverPct: number;
  handoverYears: number;
}

export interface RoiYear {
  year: number;
  propertyValue: number;
  capitalOrDebtPayment: number;
  grossRent: number;
  serviceCharges: number;
  netRentalIncome: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  mortgageBalance: number;
  saleProceeds: number;
}

export interface RoiResult {
  mode: RoiPropertyMode;
  initialCashOutflow: number;
  annualNetRentalIncome: number;
  cashOnCashPct: number | null;
  irrPct: number | null;
  paymentPlanTotalPct: number;
  paymentPlanValid: boolean;
  handoverYears: number;
  rows: RoiYear[];
  irrCashFlows: number[];
}

/** Annual IRR from Year 0 through Year 10, including net sale proceeds in Year 10. */
export function calculateIrr(cashFlows: number[]): number | null {
  if (cashFlows.length < 2 || !cashFlows.some((value) => value > 0) || !cashFlows.some((value) => value < 0)) {
    return null;
  }

  const npv = (rate: number) => cashFlows.reduce((total, cashFlow, year) => total + cashFlow / Math.pow(1 + rate, year), 0);
  let low = -0.999999;
  let high = 1;
  let lowNpv = npv(low);
  let highNpv = npv(high);

  while (lowNpv * highNpv > 0 && high < 1_000_000) {
    high *= 2;
    highNpv = npv(high);
  }
  if (!Number.isFinite(lowNpv) || !Number.isFinite(highNpv) || lowNpv * highNpv > 0) return null;

  for (let iteration = 0; iteration < 200; iteration += 1) {
    const middle = (low + high) / 2;
    const middleNpv = npv(middle);
    if (Math.abs(middleNpv) < 0.000001) return middle * 100;
    if (lowNpv * middleNpv <= 0) {
      high = middle;
      highNpv = middleNpv;
    } else {
      low = middle;
      lowNpv = middleNpv;
    }
  }

  return ((low + high) / 2) * 100;
}

export function calculateRoi(input: RoiInput, mode: RoiPropertyMode): RoiResult {
  return mode === "off-plan" ? calculateOffPlanRoi(input) : calculateReadyRoi(input);
}

function sharedValues(input: RoiInput) {
  const purchasePrice = Math.max(0, input.purchasePriceUsd);
  const annualRent = Math.max(0, input.monthlyRentUsd) * 12;
  const annualServiceCharges = Math.max(0, input.annualServiceChargesUsd);
  const appreciationRate = Math.max(-100, input.annualAppreciationPct) / 100;
  return { purchasePrice, annualRent, annualServiceCharges, appreciationRate };
}

function calculateReadyRoi(input: RoiInput): RoiResult {
  const { purchasePrice, annualRent, annualServiceCharges, appreciationRate } = sharedValues(input);
  const downPaymentPct = Math.min(100, Math.max(0, input.downPaymentPct));
  const initialCashOutflow = purchasePrice * downPaymentPct / 100;
  const loanTermYears = Math.max(1, Math.round(input.loanTermYears));
  const mortgage = calculateMortgage({
    homePrice: purchasePrice,
    downPayment: initialCashOutflow,
    annualRatePct: Math.max(0, input.interestRatePct),
    years: loanTermYears,
  });
  const annualDebtService = mortgage.monthlyPI * 12;
  const annualNetRentalIncome = annualRent - annualServiceCharges;
  const irrCashFlows = [-initialCashOutflow];
  const rows: RoiYear[] = [];
  let cumulativeCashFlow = -initialCashOutflow;

  for (let year = 1; year <= ROI_PROJECTION_YEARS; year += 1) {
    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
    const capitalOrDebtPayment = year <= loanTermYears ? annualDebtService : 0;
    const netCashFlow = annualNetRentalIncome - capitalOrDebtPayment;
    cumulativeCashFlow += netCashFlow;
    const mortgageBalance = year <= loanTermYears ? (mortgage.schedule[year - 1]?.balance ?? 0) : 0;
    const saleProceeds = year === ROI_PROJECTION_YEARS ? propertyValue - mortgageBalance : 0;
    irrCashFlows.push(netCashFlow + saleProceeds);
    rows.push({
      year,
      propertyValue,
      capitalOrDebtPayment,
      grossRent: annualRent,
      serviceCharges: annualServiceCharges,
      netRentalIncome: annualNetRentalIncome,
      netCashFlow,
      cumulativeCashFlow,
      mortgageBalance,
      saleProceeds,
    });
  }

  return {
    mode: "ready",
    initialCashOutflow,
    annualNetRentalIncome,
    cashOnCashPct: initialCashOutflow > 0 ? (annualNetRentalIncome - annualDebtService) / initialCashOutflow * 100 : null,
    irrPct: calculateIrr(irrCashFlows),
    paymentPlanTotalPct: 100,
    paymentPlanValid: true,
    handoverYears: 0,
    rows,
    irrCashFlows,
  };
}

function calculateOffPlanRoi(input: RoiInput): RoiResult {
  const { purchasePrice, annualRent, annualServiceCharges, appreciationRate } = sharedValues(input);
  const downPaymentPct = Math.min(100, Math.max(0, input.downPaymentPct));
  const duringConstructionPct = Math.min(100, Math.max(0, input.duringConstructionPct));
  const onHandoverPct = Math.min(100, Math.max(0, input.onHandoverPct));
  const handoverYears = Math.min(5, Math.max(1, Math.round(input.handoverYears)));
  const initialCashOutflow = purchasePrice * downPaymentPct / 100;
  const duringConstructionTotal = purchasePrice * duringConstructionPct / 100;
  const annualConstructionPayment = duringConstructionTotal / handoverYears;
  const onHandoverPayment = purchasePrice * onHandoverPct / 100;
  const paymentPlanTotalPct = downPaymentPct + duringConstructionPct + onHandoverPct;
  const totalPlannedInvestment = initialCashOutflow + duringConstructionTotal + onHandoverPayment;
  const annualNetRentalIncome = annualRent - annualServiceCharges;
  const irrCashFlows = [-initialCashOutflow];
  const rows: RoiYear[] = [];
  let cumulativeCashFlow = -initialCashOutflow;

  for (let year = 1; year <= ROI_PROJECTION_YEARS; year += 1) {
    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
    const constructionPayment = year <= handoverYears ? annualConstructionPayment : 0;
    const handoverPayment = year === handoverYears ? onHandoverPayment : 0;
    const capitalOrDebtPayment = constructionPayment + handoverPayment;
    const isAfterHandover = year > handoverYears;
    const grossRent = isAfterHandover ? annualRent : 0;
    const serviceCharges = isAfterHandover ? annualServiceCharges : 0;
    const netRentalIncome = grossRent - serviceCharges;
    const netCashFlow = netRentalIncome - capitalOrDebtPayment;
    cumulativeCashFlow += netCashFlow;
    const saleProceeds = year === ROI_PROJECTION_YEARS ? propertyValue : 0;
    irrCashFlows.push(netCashFlow + saleProceeds);
    rows.push({
      year,
      propertyValue,
      capitalOrDebtPayment,
      grossRent,
      serviceCharges,
      netRentalIncome,
      netCashFlow,
      cumulativeCashFlow,
      mortgageBalance: 0,
      saleProceeds,
    });
  }

  return {
    mode: "off-plan",
    initialCashOutflow,
    annualNetRentalIncome,
    cashOnCashPct: totalPlannedInvestment > 0 ? annualNetRentalIncome / totalPlannedInvestment * 100 : null,
    irrPct: calculateIrr(irrCashFlows),
    paymentPlanTotalPct,
    paymentPlanValid: Math.abs(paymentPlanTotalPct - 100) < 0.000001,
    handoverYears,
    rows,
    irrCashFlows,
  };
}
