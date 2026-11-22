import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PropertyCard } from "@/components/site/property-card";
import { SearchFilters } from "@/components/site/search-filters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { filterProperties, parseFilters, sortProperties, type PropertySort, type PropertyFilters } from "@/lib/properties";
import { propertiesQuery } from "@/lib/properties.queries";

export const Route = createFileRoute("/properties/")({
  validateSearch: (search: Record<string, unknown>): PropertyFilters => parseFilters(search),
  head: () => ({
    meta: [
      { title: "Luxury properties in the USA, Dubai & Abu Dhabi | Globe And Gable" },
      { name: "description", content: "Browse luxury apartments, penthouses, townhouses and villas in the USA, Dubai and Abu Dhabi. Filter by country, city, buy or rent, price and size." },
      { property: "og:title", content: "Luxury properties in the USA, Dubai & Abu Dhabi | Globe And Gable" },
      { property: "og:description", content: "Search luxury listings across the USA, Dubai and Abu Dhabi by price, bedrooms and amenities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(propertiesQuery()),
  component: PropertiesPage,
});

type Sort = PropertySort;

function PropertiesPage() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: "/properties/" });
  const [sort, setSort] = useState<Sort>("featured");
  const { data: properties } = useSuspenseQuery(propertiesQuery());

  const results = useMemo(() => {
    return sortProperties(filterProperties(properties, filters), sort);
  }, [properties, filters, sort]);

  const title =
    filters.type === "rent" ? "Homes for rent" : filters.type === "buy" ? "Homes for sale" : "All properties";

  return (
    <>
      <section className="bg-navy pb-24 pt-12 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow text-highlight">Search</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">
            {title}
            {filters.city ? ` in ${filters.city}` : filters.country ? ` in ${filters.country}` : filters.region ? ` in ${filters.region}` : " in the USA, Dubai & Abu Dhabi"}
          </h1>
        </div>
      </section>
      <div className="mx-auto -mt-16 max-w-7xl px-4 sm:px-6">
        <SearchFilters value={filters} options={properties} onChange={(next) => navigate({ search: next, replace: true })} />
      </div>
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{results.length}</span> of {properties.length} properties
          </p>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-52" aria-label="Sort"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Sort: Featured</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="size-desc">Size: largest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {results.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">
            <p className="font-display text-xl">No properties match these filters</p>
            <Button className="mt-6" variant="secondary" onClick={() => navigate({ search: {}, replace: true })}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </>
  );
}
