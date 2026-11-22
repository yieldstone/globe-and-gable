import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Calculator, Globe2, ShieldCheck } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import heroImg from "@/assets/hero-city.jpg";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/site/property-card";
import { SearchFilters } from "@/components/site/search-filters";
import { agencies, countriesIn, filterProperties, sortProperties, type PropertyFilters } from "@/lib/properties";
import { propertiesQuery } from "@/lib/properties.queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas Estates — Homes for sale and rent worldwide" },
      { name: "description", content: "Search apartments, houses and villas across New York, Paris, Dubai, Bali, Sydney and more. Prices in USD or AED." },
      { property: "og:title", content: "Atlas Estates — Homes for sale and rent worldwide" },
      { property: "og:description", content: "Search apartments, houses and villas across the world's most loved cities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(propertiesQuery()),
  component: Index,
});

function Index() {
  const [filters, setFilters] = useState<PropertyFilters>({});
  const navigate = useNavigate();
  const { data: properties } = useSuspenseQuery(propertiesQuery());
  const countries = countriesIn(properties);
  const results = useMemo(() => sortProperties(filterProperties(properties, filters)), [properties, filters]);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-deep text-navy-foreground">
        <img src={heroImg} alt="" width={1920} height={1088} className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="mx-auto max-w-7xl px-4 pb-40 pt-20 sm:px-6 sm:pt-28">
          <p className="eyebrow text-highlight">{countries.length} countries · {properties.length} curated listings</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.05] sm:text-6xl">
            Find your place, anywhere in the world.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-navy-muted">
            Apartments, family houses and villas for sale and rent — from Manhattan penthouses to
            tropical retreats in Bali.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-4 sm:px-6">
        <SearchFilters
          value={filters}
          onChange={setFilters}
          options={properties}
          submitLabel="View all"
          onSubmit={() => navigate({ to: "/properties", search: filters })}
        />
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-primary">Featured worldwide</p>
            <h2 className="mt-2 text-3xl font-medium sm:text-4xl">
              {results.length} {results.length === 1 ? "home" : "homes"} match your search
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/properties" search={filters}>
              Open full search <ArrowRight />
            </Link>
          </Button>
        </div>

        {results.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
            <p className="font-display text-xl">No homes match these filters</p>
            <p className="mt-2 text-sm text-muted-foreground">Try widening the price range or choosing another city.</p>
            <Button className="mt-6" variant="secondary" onClick={() => setFilters({})}>Reset filters</Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Globe2, title: "Truly global", text: `Listings across ${countries.length} countries, shown in USD or AED.` },
            { icon: ShieldCheck, title: "Verified agencies", text: `${agencies.length} trusted partner agencies, rated by buyers and tenants.` },
            { icon: Building2, title: "Every kind of home", text: "City apartments, family houses and luxury villas — to buy or to rent." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-card">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-xl font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-3xl bg-navy p-8 text-navy-foreground sm:p-12 md:flex-row md:items-center">
          <div>
            <Calculator className="size-7 text-highlight" />
            <h2 className="mt-4 text-3xl font-medium">What would your monthly payment be?</h2>
            <p className="mt-2 max-w-lg text-navy-muted">Estimate your mortgage in seconds, including taxes and insurance.</p>
          </div>
          <Button asChild variant="hero" size="lg">
            <Link to="/mortgage-calculator">Open mortgage calculator <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}
