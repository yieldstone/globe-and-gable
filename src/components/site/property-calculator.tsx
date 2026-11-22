import { useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "./currency-context";
import { convertFromUsd, convertToUsd } from "@/lib/currency";
import { calculateMortgage, calculateRentalRoi } from "@/lib/mortgage";

export function PropertyCalculator({ purchasePrice }: { purchasePrice: number }) {
  const { currency, price } = useCurrency();
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(25);
  const [rentUsd, setRentUsd] = useState(0);
  const [expensesUsd, setExpensesUsd] = useState(0);
  const downPayment = purchasePrice * downPct / 100;
  const mortgage = calculateMortgage({ homePrice: purchasePrice, downPayment, annualRatePct: rate, years });
  const roi = calculateRentalRoi({ purchasePrice, downPayment, monthlyRent: rentUsd, annualExpenses: expensesUsd, monthlyMortgage: mortgage.monthlyPI });
  const local = (usd: number) => usd ? Math.round(convertFromUsd(usd, currency)).toLocaleString("en-US") : "";
  const usd = (value: string) => convertToUsd(Number(value.replace(/[^\d]/g, "")), currency);

  return (
    <section className="mt-10 border-y border-border py-8" aria-label="Mortgage and ROI calculator">
      <h2 className="flex items-center gap-2 text-2xl font-medium"><Calculator className="size-5 text-primary" />Mortgage & ROI Calculator</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap justify-between gap-2 text-sm"><Label>Down payment</Label><span className="font-semibold">{downPct}% · {price(downPayment)}</span></div>
            <Slider min={0} max={100} step={1} value={[downPct]} onValueChange={([v]) => setDownPct(v ?? 20)} aria-label="Property down payment percent" />
          </div>
          <div className="space-y-1.5"><Label htmlFor="property-rate">Interest rate (%)</Label><Input id="property-rate" type="number" min={0} max={30} step={0.1} value={rate} onChange={(e) => setRate(Math.min(30, Math.max(0, Number(e.target.value) || 0)))} /></div>
          <div className="space-y-1.5"><Label>Loan term</Label><Select value={String(years)} onValueChange={(v) => setYears(Number(v))}><SelectTrigger className="w-full" aria-label="Property loan term"><SelectValue /></SelectTrigger><SelectContent>{[10, 15, 20, 25, 30].map((y) => <SelectItem key={y} value={String(y)}>{y} years</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="property-rent">Expected monthly rent ({currency})</Label><Input id="property-rent" inputMode="numeric" placeholder="Enter rental estimate" value={local(rentUsd)} onChange={(e) => setRentUsd(usd(e.target.value))} /></div>
          <div className="space-y-1.5"><Label htmlFor="property-expenses">Annual operating costs ({currency})</Label><Input id="property-expenses" inputMode="numeric" placeholder="Taxes, service charges, maintenance" value={local(expensesUsd)} onChange={(e) => setExpensesUsd(usd(e.target.value))} /></div>
        </div>
        <div className="min-w-0 bg-navy p-6 text-navy-foreground">
          <p className="text-sm text-navy-muted">Estimated monthly payment</p>
          <p className="mt-3 break-words font-display text-3xl font-semibold" data-testid="property-monthly-payment">{price(mortgage.monthlyPI)}</p>
          <dl className="mt-6 space-y-4 border-t border-navy-border pt-5 text-sm">
            {[
              ["Loan amount", price(mortgage.loanAmount)],
              ["Gross rental yield", rentUsd > 0 ? `${roi.grossYield.toFixed(2)}%` : "—"],
              ["Net rental yield", rentUsd > 0 ? `${roi.netYield.toFixed(2)}%` : "—"],
              ["Monthly cash flow", rentUsd > 0 ? price(roi.monthlyCashFlow) : "—"],
              ["Cash-on-cash return", rentUsd > 0 && roi.cashOnCash !== null ? `${roi.cashOnCash.toFixed(2)}%` : "—"],
            ].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-navy-muted">{label}</dt><dd className="font-semibold">{value}</dd></div>)}
          </dl>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Illustrative estimates, not a lending offer. Mortgage payment excludes taxes, insurance and fees. Rental returns use your rent and operating-cost estimates; cash-on-cash excludes closing costs, appreciation and sale proceeds.</p>
    </section>
  );
}