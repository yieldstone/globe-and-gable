export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  annualRatePct: number;
  years: number;
  propertyTaxPct?: number; // yearly, % of home price
  insurancePerYear?: number;
}

export function monthlyPrincipalAndInterest(principal: number, annualRatePct: number, years: number) {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

export function calculateMortgage(input: MortgageInput) {
  const loanAmount = Math.max(0, input.homePrice - input.downPayment);
  const monthlyPI = monthlyPrincipalAndInterest(loanAmount, input.annualRatePct, input.years);
  const monthlyTax = ((input.propertyTaxPct ?? 0) / 100) * input.homePrice / 12;
  const monthlyInsurance = (input.insurancePerYear ?? 0) / 12;
  const months = Math.round(input.years * 12);
  const totalPaid = monthlyPI * months;
  const totalInterest = Math.max(0, totalPaid - loanAmount);

  // Year-end remaining balance for charting
  const r = input.annualRatePct / 100 / 12;
  const schedule: { year: number; balance: number; interestPaid: number; principalPaid: number }[] = [];
  let balance = loanAmount;
  let interestPaid = 0;
  let principalPaid = 0;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principal = Math.min(balance, monthlyPI - interest);
    balance = Math.max(0, balance - principal);
    interestPaid += interest;
    principalPaid += principal;
    if (m % 12 === 0 || m === months) {
      schedule.push({ year: Math.ceil(m / 12), balance, interestPaid, principalPaid });
    }
  }

  return {
    loanAmount,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    monthlyTotal: monthlyPI + monthlyTax + monthlyInsurance,
    totalInterest,
    totalCost: totalPaid + input.downPayment,
    schedule,
  };
}
