import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, CalendarClock, Download, Info, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { WhiteLabelAgencyBanner } from "@/components/site/white-label-agency-banner";
import { convertFromUsd, convertToUsd, formatMoney, type Currency } from "@/lib/currency";
import { calculateRoi, type RoiInput, type RoiMarket, type RoiPropertyMode } from "@/lib/roi";
import { exportRoiPdf } from "@/lib/roi-pdf";

export const Route = createFileRoute("/roi-calculator")({
  head: () => ({
    meta: [
      { title: "Yieldstone ROI Calculator — USA, Dubai & Abu Dhabi | Globe And Gable" },
      { name: "description", content: "Model 10-year property returns, cash-on-cash and IRR in USD or AED, including Dubai and Abu Dhabi off-plan payment schedules." },
      { property: "og:title", content: "Yieldstone ROI Calculator | Globe And Gable" },
      { property: "og:description", content: "Compare ready and off-plan property investments across the USA, Dubai and Abu Dhabi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoiCalculatorPage,
});

const DEFAULT_VALUES: RoiInput = {
  purchasePriceUsd: 650_000,
  monthlyRentUsd: 4_500,
  annualServiceChargesUsd: 6_000,
  annualAppreciationPct: 3,
  downPaymentPct: 20,
  interestRatePct: 6.25,
  loanTermYears: 30,
  duringConstructionPct: 40,
  onHandoverPct: 40,
  handoverYears: 2,
};

function RoiCalculatorPage() {
  const [market, setMarket] = useState<RoiMarket>("USA");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [mode, setMode] = useState<RoiPropertyMode>("ready");
  const [values, setValues] = useState<RoiInput>(DEFAULT_VALUES);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const result = useMemo(() => calculateRoi(values, mode), [values, mode]);
  const finalYear = result.rows.at(-1);
  const offPlan = mode === "off-plan";

  const money = (usd: number, compact = false) => formatMoney(convertFromUsd(usd, currency), currency, { compact });
  const percent = (value: number | null) => value === null ? "—" : `${value.toFixed(2)}%`;
  const update = <K extends keyof RoiInput>(key: K, value: RoiInput[K]) => setValues((current) => ({ ...current, [key]: value }));

  const selectMarket = (nextMarket: RoiMarket) => {
    setMarket(nextMarket);
    setCurrency(nextMarket === "USA" ? "USD" : "AED");
    if (nextMarket === "USA") setMode("ready");
  };

  const chartData = [
    { year: 0, propertyValue: convertFromUsd(values.purchasePriceUsd, currency), cumulativeCashFlow: convertFromUsd(-result.initialCashOutflow, currency) },
    ...result.rows.map((row) => ({
      year: row.year,
      propertyValue: convertFromUsd(row.propertyValue, currency),
      cumulativeCashFlow: convertFromUsd(row.cumulativeCashFlow, currency),
    })),
  ];

  const downloadPdf = async () => {
    if (!result.paymentPlanValid) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportRoiPdf({ market, currency, values, result });
    } catch {
      setExportError("The PDF could not be created. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <section className="bg-navy pb-16 pt-12 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow text-highlight">Yieldstone investment intelligence</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">ROI Calculator</h1>
          <p className="mt-3 max-w-2xl text-navy-muted">Model 10-year returns for ready and off-plan property across the USA, Dubai and Abu Dhabi, with clear cash-flow, IRR and equity projections.</p>
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border bg-card p-6 shadow-card sm:p-8" aria-labelledby="investment-inputs-title">
              <div className="flex items-center gap-3">
                <Building2 className="size-6 text-primary" />
                <div>
                  <p className="eyebrow text-primary">Your investment</p>
                  <h2 id="investment-inputs-title" className="mt-1 text-2xl font-medium">Property & payment details</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Market</Label>
                  <Select value={market} onValueChange={(value) => selectMarket(value as RoiMarket)}>
                    <SelectTrigger className="w-full" aria-label="Investment market"><SelectValue /></SelectTrigger>
                    <SelectContent>{(["USA", "Dubai", "Abu Dhabi"] as const).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <div className="grid grid-cols-2 rounded-md border bg-background p-1" role="group" aria-label="Display currency">
                    {(["USD", "AED"] as const).map((item) => (
                      <Button key={item} type="button" size="sm" variant={currency === item ? "default" : "ghost"} aria-pressed={currency === item} onClick={() => setCurrency(item)}>
                        {item === "USD" ? "USD ($)" : "AED"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {market !== "USA" && (
                <div className="mt-6 rounded-xl border bg-secondary/50 p-4">
                  <Label>Property mode</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2" role="group" aria-label="Property mode">
                    <Button type="button" variant={mode === "ready" ? "default" : "outline"} aria-pressed={mode === "ready"} onClick={() => setMode("ready")}>Ready Property</Button>
                    <Button type="button" variant={mode === "off-plan" ? "default" : "outline"} aria-pressed={mode === "off-plan"} onClick={() => setMode("off-plan")}>Off-Plan (Under Construction)</Button>
                  </div>
                </div>
              )}

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <MoneyInput id="roi-price" label="Purchase price" valueUsd={values.purchasePriceUsd} currency={currency} onChange={(value) => update("purchasePriceUsd", value)} />
                <MoneyInput id="roi-rent" label="Expected monthly rent" valueUsd={values.monthlyRentUsd} currency={currency} onChange={(value) => update("monthlyRentUsd", value)} />
                <MoneyInput id="roi-service" label="Annual service charges" valueUsd={values.annualServiceChargesUsd} currency={currency} onChange={(value) => update("annualServiceChargesUsd", value)} />
                <div className="space-y-2">
                  <Label htmlFor="roi-appreciation">Annual capital appreciation (%)</Label>
                  <Input id="roi-appreciation" type="number" min={-100} max={50} step={0.1} value={values.annualAppreciationPct} onChange={(event) => update("annualAppreciationPct", Math.min(50, Math.max(-100, Number(event.target.value) || 0)))} />
                </div>
              </div>

              {!offPlan ? (
                <div className="mt-8 border-t pt-7">
                  <h3 className="text-xl font-medium">Mortgage</h3>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-3 sm:col-span-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <Label>Down payment</Label>
                        <span className="text-sm font-semibold">{values.downPaymentPct}% · {money(values.purchasePriceUsd * values.downPaymentPct / 100)}</span>
                      </div>
                      <Slider min={0} max={100} step={1} value={[values.downPaymentPct]} onValueChange={([value]) => update("downPaymentPct", value ?? 20)} aria-label="ROI down payment percent" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roi-rate">Interest rate (%)</Label>
                      <Input id="roi-rate" type="number" min={0} max={30} step={0.05} value={values.interestRatePct} onChange={(event) => update("interestRatePct", Math.min(30, Math.max(0, Number(event.target.value) || 0)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Loan term</Label>
                      <Select value={String(values.loanTermYears)} onValueChange={(value) => update("loanTermYears", Number(value))}>
                        <SelectTrigger className="w-full" aria-label="ROI loan term"><SelectValue /></SelectTrigger>
                        <SelectContent>{[10, 15, 20, 25, 30].map((year) => <SelectItem key={year} value={String(year)}>{year} years</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 border-t pt-7">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-5 text-primary" />
                    <h3 className="text-xl font-medium">Off-Plan Payment Plan</h3>
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <PercentageInput id="offplan-down" label="Down Payment %" value={values.downPaymentPct} onChange={(value) => update("downPaymentPct", value)} />
                    <PercentageInput id="offplan-construction" label="During Construction %" value={values.duringConstructionPct} onChange={(value) => update("duringConstructionPct", value)} />
                    <PercentageInput id="offplan-handover" label="On Handover %" value={values.onHandoverPct} onChange={(value) => update("onHandoverPct", value)} />
                    <div className="space-y-2">
                      <Label>Handover Timeline in Years</Label>
                      <Select value={String(values.handoverYears)} onValueChange={(value) => update("handoverYears", Number(value))}>
                        <SelectTrigger className="w-full" aria-label="Handover timeline"><SelectValue /></SelectTrigger>
                        <SelectContent>{[1, 2, 3, 4, 5].map((year) => <SelectItem key={year} value={String(year)}>{year} {year === 1 ? "year" : "years"}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className={`mt-5 flex gap-2 rounded-xl border p-4 text-sm ${result.paymentPlanValid ? "text-muted-foreground" : "border-destructive/40 text-destructive"}`} role={result.paymentPlanValid ? undefined : "alert"}>
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>Payment plan total: <strong>{result.paymentPlanTotalPct}%</strong>. {result.paymentPlanValid ? `Construction payments are spread evenly through Year ${result.handoverYears}; rent and service charges begin in Year ${result.handoverYears + 1}.` : "Down payment, construction and handover payments must total 100%."}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border bg-card p-6 shadow-card sm:p-8" aria-labelledby="projection-chart-title">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-primary">10-year projection</p>
                  <h2 id="projection-chart-title" className="mt-1 text-2xl font-medium">Value & cumulative cash flow</h2>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{currency}</span>
              </div>
              <div className="mt-5 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 12 }}>
                    <defs>
                      <linearGradient id="roi-value" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(year) => `Yr ${year}`} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} width={82} tickFormatter={(value: number) => formatMoney(value, currency, { compact: true })} />
                    <Tooltip
                      formatter={(value: number, name) => [formatMoney(Number(value), currency), name === "propertyValue" ? "Property value" : "Cumulative cash flow"]}
                      labelFormatter={(year) => `Year ${year}`}
                    />
                    <Area type="monotone" dataKey="propertyValue" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#roi-value)" />
                    <Area type="monotone" dataKey="cumulativeCashFlow" stroke="var(--color-chart-2)" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-chart-1" />Property value</span>
                <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-chart-2" />Cumulative cash flow before sale</span>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-navy p-7 text-navy-foreground shadow-elevated sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow text-navy-muted">10-year investment IRR</p>
                <TrendingUp className="size-5 text-highlight" />
              </div>
              <p className="mt-3 font-display text-5xl font-semibold" data-testid="roi-irr">{percent(result.irrPct)}</p>
              <p className="mt-2 text-xs leading-relaxed text-navy-muted">Includes annual cash flows and estimated net sale proceeds in Year 10.</p>
              <dl className="mt-7 space-y-5 border-t border-navy-border pt-6 text-sm">
                <ResultRow label={offPlan ? "Post-handover cash-on-cash" : "Annual cash-on-cash"} value={percent(result.cashOnCashPct)} testId="roi-coc" />
                <ResultRow label="Year 10 property value" value={finalYear ? money(finalYear.propertyValue) : "—"} />
                <ResultRow label={offPlan ? "Annual net rent after handover" : "Annual net rental income"} value={money(result.annualNetRentalIncome)} />
                <ResultRow label="Initial cash outflow" value={money(result.initialCashOutflow)} />
                {offPlan && <ResultRow label="Rental income begins" value={`Year ${result.handoverYears + 1}`} />}
              </dl>
              <Button variant="hero" size="lg" className="mt-7 w-full" disabled={exporting || !result.paymentPlanValid} onClick={() => void downloadPdf()}>
                <Download />{exporting ? "Creating PDF…" : `Export ${currency} PDF`}
              </Button>
              {exportError && <p className="mt-3 text-xs text-navy-foreground" role="alert">{exportError}</p>}
            </div>
            <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">Illustrative estimates only, excluding transaction costs, taxes, vacancies and financing fees. AED values use the exact pegged rate of 1 USD = 3.6725 AED.</p>
          </aside>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-card" aria-labelledby="projection-table-title">
          <div className="p-6 sm:p-8">
            <p className="eyebrow text-primary">Year-by-year detail</p>
            <h2 id="projection-table-title" className="mt-1 text-2xl font-medium">10-year cash-flow comparison</h2>
            <p className="mt-2 text-sm text-muted-foreground">All monetary columns are shown in {currency}. Net cash flow excludes sale proceeds; IRR includes them in Year 10.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-t text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr>
                  {["Year", "Property value", offPlan ? "Capital payment" : "Debt service", "Net rental income", "Net cash flow", "Cumulative cash flow", "Sale proceeds", "Loan balance"].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.year} className="border-t">
                    <td className="px-5 py-4 font-semibold">Year {row.year}</td>
                    <td className="px-5 py-4">{money(row.propertyValue)}</td>
                    <td className="px-5 py-4">{money(row.capitalOrDebtPayment)}</td>
                    <td className="px-5 py-4" data-testid={`year-${row.year}-net-rent`}>{money(row.netRentalIncome)}</td>
                    <td className={`px-5 py-4 ${row.netCashFlow < 0 ? "text-destructive" : "text-foreground"}`}>{money(row.netCashFlow)}</td>
                    <td className="px-5 py-4">{money(row.cumulativeCashFlow)}</td>
                    <td className="px-5 py-4">{money(row.saleProceeds)}</td>
                    <td className="px-5 py-4">{money(row.mortgageBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <WhiteLabelAgencyBanner />
      </div>
    </>
  );
}

function MoneyInput({ id, label, valueUsd, currency, onChange }: { id: string; label: string; valueUsd: number; currency: Currency; onChange: (value: number) => void }) {
  const display = valueUsd ? Math.round(convertFromUsd(valueUsd, currency)).toLocaleString("en-US") : "";
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} ({currency})</Label>
      <Input id={id} inputMode="numeric" value={display} onChange={(event) => onChange(convertToUsd(Number(event.target.value.replace(/[^\d]/g, "") || 0), currency))} />
    </div>
  );
}

function PercentageInput({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={0} max={100} step={1} value={value} onChange={(event) => onChange(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} />
    </div>
  );
}

function ResultRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <dt className="text-navy-muted">{label}</dt>
      <dd className="text-right font-semibold" data-testid={testId}>{value}</dd>
    </div>
  );
}
