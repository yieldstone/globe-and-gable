import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { convertFromUsd, convertToUsd } from "@/lib/currency";
import { toSquareMeters, toSquareFeet } from "@/lib/units";
import { AMENITIES, REGIONS, citiesFor, countriesIn, regionFor, type Property, type PropertyFilters } from "@/lib/properties";
import { useCurrency } from "./currency-context";

const ANY = "__any";
interface Props {
  value: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  className?: string;
  options: Property[];
}

export function SearchFilters({ value, onChange, onSubmit, submitLabel = "Search", className, options }: Props) {
  const { currency } = useCurrency();
  const scopedOptions = options.filter((p) => !value.region || regionFor(p) === value.region);
  const set = (patch: Partial<PropertyFilters>) => onChange({ ...value, ...patch });
  const priceInput = (key: "minPrice" | "maxPrice") => value[key] == null ? "" : Math.round(convertFromUsd(value[key], currency)).toLocaleString("en-US");
  const onPrice = (key: "minPrice" | "maxPrice", raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    set({ [key]: digits === "" ? undefined : convertToUsd(Number(digits), currency) });
  };
  const hasFilters = Object.values(value).some((v) => Array.isArray(v) ? v.length > 0 : v !== undefined);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className={cn("rounded-2xl border bg-card p-4 text-card-foreground shadow-elevated sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1" role="radiogroup" aria-label="Buy or rent">
          {([[undefined, "All"], ["buy", "Buy"], ["rent", "Rent"]] as const).map(([t, label]) => (
            <Button key={label} type="button" variant={value.type === t ? "default" : "ghost"} role="radio" aria-checked={value.type === t} size="sm" onClick={() => set({ type: t })} className="px-5">{label}</Button>
          ))}
        </div>
        {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={() => onChange({})}><X />Clear filters</Button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Field label="Region">
          <Select value={value.region ?? ANY} onValueChange={(v) => set({ region: REGIONS.find((r) => r === v), country: undefined, city: undefined })}>
            <SelectTrigger className="w-full" aria-label="Region"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ANY}>Worldwide</SelectItem>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Country">
          <Select value={value.country ?? ANY} onValueChange={(v) => set({ country: v === ANY ? undefined : v, city: undefined })}>
            <SelectTrigger className="w-full" aria-label="Country"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ANY}>All countries</SelectItem>{countriesIn(scopedOptions).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="City">
          <Select value={value.city ?? ANY} onValueChange={(v) => set({ city: v === ANY ? undefined : v })}>
            <SelectTrigger className="w-full" aria-label="City"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ANY}>All cities</SelectItem>{citiesFor(value.country, scopedOptions).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Property type">
          <Select value={value.kind ?? ANY} onValueChange={(v) => set({ kind: v === ANY ? undefined : v as PropertyFilters["kind"] })}>
            <SelectTrigger className="w-full" aria-label="Property type"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ANY}>All types</SelectItem>{["Villa", "Penthouse", "Apartment", "Townhouse", "House"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label={`Min price (${currency})`}><Input aria-label={`Minimum price (${currency})`} inputMode="numeric" placeholder="No min" value={priceInput("minPrice")} onChange={(e) => onPrice("minPrice", e.target.value)} /></Field>
        <Field label={`Max price (${currency})`}><Input aria-label={`Maximum price (${currency})`} inputMode="numeric" placeholder="No max" value={priceInput("maxPrice")} onChange={(e) => onPrice("maxPrice", e.target.value)} /></Field>
      </div>
      <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-[150px_150px_1fr_auto]">
        <Field label="Bedrooms">
          <Select value={value.bedrooms != null ? String(value.bedrooms) : ANY} onValueChange={(v) => set({ bedrooms: v === ANY ? undefined : Number(v) })}>
            <SelectTrigger className="w-full" aria-label="Bedrooms"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ANY}>Any bedrooms</SelectItem>{[1, 2, 3, 4, 5, 6].map((b) => <SelectItem key={b} value={String(b)}>{b}+ bedrooms</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Size (sq ft)">
          <Select value={value.minSize != null ? String(Math.round(toSquareFeet(value.minSize))) : ANY} onValueChange={(v) => set({ minSize: v === ANY ? undefined : toSquareMeters(Number(v)) })}>
            <SelectTrigger className="w-full" aria-label="Size"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ANY}>Any size</SelectItem>{[500, 1000, 2000, 3000, 5000].map((n) => <SelectItem key={n} value={String(n)}>{n.toLocaleString("en-US")}+ sq ft</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <fieldset className="min-w-0"><legend className="mb-1.5 text-xs font-semibold text-muted-foreground">Amenities</legend><div className="flex flex-wrap gap-1.5">
          {AMENITIES.map((a) => {
            const selected = value.amenities?.includes(a) ?? false;
            return <Button key={a} type="button" variant={selected ? "default" : "outline"} size="sm" aria-pressed={selected} onClick={() => set({ amenities: selected ? value.amenities?.filter((x) => x !== a) : [...(value.amenities ?? []), a] })}>{selected && <Check />}{a}</Button>;
          })}
        </div></fieldset>
        {onSubmit && <div className="flex items-end"><Button type="submit" className="w-full"><Search />{submitLabel}</Button></div>}
      </div>
    </form>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0 space-y-1.5"><Label className="text-xs font-semibold text-muted-foreground">{label}</Label>{children}</div>;
}
