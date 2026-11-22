import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgencyPricing } from "@/components/site/agency-pricing";
import { useSuspenseQuery } from "@tanstack/react-query";
import { agencies, img } from "@/lib/properties";
import { propertiesQuery } from "@/lib/properties.queries";

export const Route = createFileRoute("/agencies")({
  head: () => ({
    meta: [
      { title: "Real estate agencies in the USA, Dubai & Abu Dhabi | Globe And Gable" },
      { name: "description", content: "Meet our partner agencies serving New York, Miami, Los Angeles, Dubai and Abu Dhabi." },
      { property: "og:title", content: "Partner real estate agencies | Globe And Gable" },
      { property: "og:description", content: "Local real estate agencies serving the USA, Dubai and Abu Dhabi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(propertiesQuery()),
  component: AgenciesPage,
});

function AgenciesPage() {
  const { data: properties } = useSuspenseQuery(propertiesQuery());
  return (
    <>
      <section className="bg-navy pb-16 pt-12 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow text-highlight">Partners</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Agencies across the USA, Dubai & Abu Dhabi</h1>
          <p className="mt-3 max-w-xl text-navy-muted">Local experts who know every street, school and building in their market.</p>
          <Button asChild variant="hero" className="mt-6"><a href="#pricing">List your agency</a></Button>
        </div>
      </section>
      <div className="mx-auto mt-10 grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2">
        {agencies.map((a) => {
          const listings = properties.filter((p) => p.agencyId === a.id);
          return (
            <article key={a.id} className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-navy font-display text-xl text-navy-foreground">{a.logoInitials}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-medium">{a.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{a.city}, {a.country}</p>
                  <p className="mt-1 text-sm text-foreground/80">{a.specialty}</p>
                </div>
                <span className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-sm font-semibold text-accent-foreground">
                  <Star className="size-3.5 fill-highlight text-highlight" />{a.rating}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="size-4" />{a.agents} agents</span>
                <span>Since {a.founded}</span>
                <span>{listings.length} active {listings.length === 1 ? "listing" : "listings"}</span>
              </div>
              {listings.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {listings.map((p) => (
                    <Link key={p.id} to="/properties/$propertyId" params={{ propertyId: p.id }} className="group overflow-hidden rounded-xl border">
                      <img src={img(p.images[0], 500, 320)} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform group-hover:scale-105" />
                      <p className="truncate px-3 py-2 text-sm font-medium">{p.title}</p>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm"><a href={`tel:${a.phone.replace(/\s/g, "")}`}><Phone />{a.phone}</a></Button>
                <Button asChild variant="outline" size="sm"><a href={`mailto:${a.email}`}><Mail />Email</a></Button>
              </div>
            </article>
          );
        })}
      </div>
      <AgencyPricing />
    </>
  );
}
