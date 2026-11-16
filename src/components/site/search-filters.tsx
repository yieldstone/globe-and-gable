import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { convertFromUsd, convertToUsd } from "@/lib/currency";
import { citiesFor, countriesIn, type Property, type PropertyFilters } from "@/lib/properties";
import { useCurrency } from "./currency-context";

const ANY = "__any";

const sizes = [
  { value: 50, label: "50+ m²" },
  { value: 100, label: "100+ m²" },
  { value: 200, label: "200+ m²" },
  { value: 300, label: "300+ m²" },
  { value: 500, label: "500+ m²" },
];

interface Props {
  value: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  className?: string;
  /** Listings used to build the country/city options. */
  options: Property[];
}

export function SearchFilters({ value, onChange, onSubmit, submitLabel = "Search", className, options }: Props) {
  const countries = countriesIn(options);
  const { currency } = useCurrency();
  const symbol = currency === "EUR" ? "€" : "$";
  const set = (patch: Partial<PropertyFilters>) => onChange({ ...value, ...patch });

  const priceInput = (key: "minPrice" | "maxPrice") => {
    const usd = value[key];
    return usd == null ? "" : Math.round(convertFromUsd(usd, currency)).toLocaleString("en-US");
  };
  const onPrice = (key: "minPrice" | "maxPrice", raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    set({ [key]: digits === "" ? undefined : convertToUsd(Number(digits), currency) });
  };

  const hasFilters = Object.values(value).some((v) => v !== undefined);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn("rounded-2xl border bg-card p-4 text-card-foreground shadow-elevated sm:p-5", className)}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1" role="radiogroup" aria-label="Buy or rent">
          {([
            [undefined, "All"],
            ["buy", "Buy"],
            ["rent", "Rent"],
          ] as const).map(([t, label]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={value.type === t}
              onClick={() => set({ type: t })}
              className={cn(
                "rounded-md px-5 py-1.5 text-sm font-semibold transition-colors",
                value.type === t ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange({})}>
            <X /> Clear filters
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_0.9fr_auto]">
        <Field label="Country">
          <Select
            value={value.country ?? ANY}
            onValueChange={(v) => set({ country: v === ANY ? undefined : v, city: undefined })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All countries</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="City">
          <Select value={value.city ?? ANY} onValueChange={(v) => set({ city: v === ANY ? undefined : v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All cities</SelectItem>
              {citiesFor(value.country, options).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Property">
          <Select
            value={value.kind ?? ANY}
            onValueChange={(v) => set({ kind: v === ANY ? undefined : (v as PropertyFilters["kind"]) })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All types</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="House">House</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={`Min price (${symbol})`}>
          <Input inputMode="numeric" placeholder="No min" value={priceInput("minPrice")} onChange={(e) => onPrice("minPrice", e.target.value)} />
        </Field>
        <Field label={`Max price (${symbol})`}>
          <Input inputMode="numeric" placeholder="No max" value={priceInput("maxPrice")} onChange={(e) => onPrice("maxPrice", e.target.value)} />
        </Field>
        <Field label="Size">
          <Select
            value={value.minSize != null ? String(value.minSize) : ANY}
            onValueChange={(v) => set({ minSize: v === ANY ? undefined : Number(v) })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any size</SelectItem>
              {sizes.map((s) => <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {onSubmit && (
          <div className="flex items-end">
            <Button type="submit" size="lg" className="w-full">
              <Search /> {submitLabel}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
