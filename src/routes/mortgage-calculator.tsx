import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCurrency } from "@/components/site/currency-context";
import { convertFromUsd, convertToUsd } from "@/lib/currency";
import { calculateMortgage } from "@/lib/mortgage";

export const Route = createFileRoute("/mortgage-calculator")({
  validateSearch: (search: Record<string, unknown>): { price?: number | undefined } => {
    const n = Number(search["price"]);
    return Number.isFinite(n) && n > 0 ? { price: n } : {};
  },
  head: () => ({
    meta: [
      { title: "Mortgage Calculator — Estimate your monthly payment | Atlas Estates" },
      { name: "description", content: "Calculate your monthly mortgage payment with down payment, interest rate, loan term, property tax and insurance." },
      { property: "og:title", content: "Mortgage Calculator | Atlas Estates" },
      { property: "og:description", content: "Estimate monthly payments, total interest and your loan balance over time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MortgagePage,
});

function MortgagePage() {
  const { price: fromSearch } = Route.useSearch();
  const { currency, price } = useCurrency();
  const symbol = currency === "AED" ? "AED" : "$";

  const [homePriceUsd, setHomePriceUsd] = useState(fromSearch ?? 650_000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.25);
  const [years, setYears] = useState(30);
  const [taxPct, setTaxPct] = useState(1.1);
  const [insuranceUsd, setInsuranceUsd] = useState(1_500);

  const result = useMemo(
    () =>
      calculateMortgage({
        homePrice: homePriceUsd,
        downPayment: (homePriceUsd * downPct) / 100,
        annualRatePct: rate,
        years,
        propertyTaxPct: taxPct,
        insurancePerYear: insuranceUsd,
      }),
    [homePriceUsd, downPct, rate, years, taxPct, insuranceUsd],
  );

  const toLocal = (usd: number) => Math.round(convertFromUsd(usd, currency)).toLocaleString("en-US");
  const fromLocal = (raw: string) => convertToUsd(Number(raw.replace(/[^\d]/g, "") || 0), currency);

  const chartData = [{ year: 0, balance: result.loanAmount, interestPaid: 0 }, ...result.schedule].map((r) => ({
    year: r.year,
    balance: Math.round(convertFromUsd(r.balance, currency)),
    interest: Math.round(convertFromUsd(r.interestPaid, currency)),
  }));

  const breakdown = [
    { label: "Principal & interest", value: result.monthlyPI, className: "bg-chart-1" },
    { label: "Property tax", value: result.monthlyTax, className: "bg-chart-2" },
    { label: "Home insurance", value: result.monthlyInsurance, className: "bg-chart-4" },
  ];

  return (
    <>
      <section className="bg-navy pb-16 pt-12 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow text-highlight">Plan ahead</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Mortgage calculator</h1>
          <p className="mt-3 max-w-xl text-navy-muted">Adjust the numbers to see your estimated monthly payment and how your loan is paid off over time.</p>
        </div>
      </section>

      <div className="mx-auto -mt-8 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="price">Home price ({symbol})</Label>
              <Input id="price" inputMode="numeric" className="h-12 text-lg font-semibold" value={toLocal(homePriceUsd)} onChange={(e) => setHomePriceUsd(fromLocal(e.target.value))} />
            </div>

            <div className="space-y-3 sm:col-span-2">
              <div className="flex justify-between">
                <Label>Down payment</Label>
                <span className="text-sm font-semibold">{downPct}% · {price((homePriceUsd * downPct) / 100)}</span>
              </div>
              <Slider value={[downPct]} min={0} max={80} step={1} onValueChange={([v]) => setDownPct(v ?? 0)} aria-label="Down payment percent" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="rate">Interest rate</Label>
                <span className="text-sm font-semibold">{rate.toFixed(2)}%</span>
              </div>
              <Slider value={[rate]} min={0} max={15} step={0.05} onValueChange={([v]) => setRate(v ?? 0)} aria-label="Interest rate" />
              <Input id="rate" type="number" step="0.01" min={0} max={30} value={rate} onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))} />
            </div>

            <div className="space-y-3">
              <Label>Loan term</Label>
              <Select value={String(years)} onValueChange={(v) => setYears(Number(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 15, 20, 25, 30, 35].map((y) => <SelectItem key={y} value={String(y)}>{y} years</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax">Property tax (% per year)</Label>
              <Input id="tax" type="number" step="0.05" min={0} value={taxPct} onChange={(e) => setTaxPct(Math.max(0, Number(e.target.value) || 0))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ins">Home insurance ({symbol} per year)</Label>
              <Input id="ins" inputMode="numeric" value={toLocal(insuranceUsd)} onChange={(e) => setInsuranceUsd(fromLocal(e.target.value))} />
            </div>
          </div>

          <h2 className="mt-10 text-xl font-medium">Loan balance over time</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(y) => `Yr ${y}`} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={70} tickFormatter={(v) => new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency }).format(v)} />
                <Tooltip
                  formatter={(v: number, name) => [new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v), name === "balance" ? "Remaining balance" : "Interest paid"]}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Area type="monotone" dataKey="balance" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#bal)" />
                <Area type="monotone" dataKey="interest" stroke="var(--color-chart-2)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-navy p-8 text-navy-foreground shadow-elevated">
            <p className="eyebrow text-navy-muted">Estimated monthly payment</p>
            <p className="mt-3 font-display text-5xl font-semibold" data-testid="monthly-total">{price(result.monthlyTotal)}</p>
            <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-navy-foreground/10">
              {breakdown.map((b) => (
                <div key={b.label} className={b.className} style={{ width: `${result.monthlyTotal ? (b.value / result.monthlyTotal) * 100 : 0}%` }} />
              ))}
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {breakdown.map((b) => (
                <li key={b.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-navy-muted"><span className={`size-2.5 rounded-full ${b.className}`} />{b.label}</span>
                  <span className="font-semibold">{price(b.value)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3 border-t border-navy-border pt-6 text-sm">
              <Row label="Loan amount" value={price(result.loanAmount)} />
              <Row label="Down payment" value={price((homePriceUsd * downPct) / 100)} />
              <Row label="Total interest" value={price(result.totalInterest)} />
              <Row label="Total cost of loan" value={price(result.totalCost)} />
            </div>
          </div>
          <p className="mt-3 px-1 text-xs text-muted-foreground">Estimates only. Actual rates and terms depend on your lender and credit profile.</p>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-navy-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
