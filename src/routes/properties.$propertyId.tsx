import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, Bath, BedDouble, Calculator, CalendarDays, Check, ChevronLeft, ChevronRight,
  Expand, Mail, MapPin, Maximize, Phone, Star,
} from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCard } from "@/components/site/property-card";
import { useCurrency } from "@/components/site/currency-context";
import { getAgency, img, properties, type Property } from "@/lib/properties";
import { propertyQuery } from "@/lib/listings.queries";

export const Route = createFileRoute("/properties/$propertyId")({
  loader: async ({ params, context }) => {
    const property = await context.queryClient.ensureQueryData(propertyQuery(params.propertyId));
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Property not found | Atlas Estates" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.property;
    const title = `${p.title} — ${p.city}, ${p.country} | Atlas Estates`;
    const description = `${p.kind} ${p.listing === "buy" ? "for sale" : "for rent"} in ${p.neighborhood}, ${p.city}. ${p.beds} bedrooms, ${p.baths} bathrooms, ${p.sizeM2} m².`;
    // Submitted listings use expiring photo links, so only the built-in samples get a share image.
    const image = p.userSubmitted ? null : img(p.images[0], 1200, 630);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-medium">This property is no longer available</h1>
      <Button asChild className="mt-6"><Link to="/properties">Browse properties</Link></Button>
    </div>
  ),
  component: PropertyPage,
});

function PropertyPage() {
  const { propertyId } = Route.useParams();
  const { data } = useSuspenseQuery(propertyQuery(propertyId));
  const p = data ?? Route.useLoaderData().property;
  const { price } = useCurrency();
  const agency = p.agencyId ? getAgency(p.agencyId) : undefined;
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const similar = properties.filter((x) => x.id !== p.id && (x.kind === p.kind || x.listing === p.listing)).slice(0, 3);

  const d = 0.012;
  const hasCoords = p.lat != null && p.lng != null;
  const lat = p.lat ?? 0;
  const lng = p.lng ?? 0;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  const largeMapHref = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${p.neighborhood}, ${p.city}, ${p.country}`)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to properties
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex gap-2">
            <Badge variant={p.listing === "buy" ? "default" : "highlight"}>{p.listing === "buy" ? "For sale" : "For rent"}</Badge>
            <Badge variant="secondary">{p.kind}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-medium sm:text-5xl">{p.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" /> {p.neighborhood}, {p.city}, {p.country}
          </p>
        </div>
        <p className="font-display text-3xl font-semibold text-primary sm:text-4xl">
          {price(p.priceUsd)}
          {p.listing === "rent" && <span className="ml-1 font-sans text-base font-medium text-muted-foreground">/ month</span>}
        </p>
      </div>

      <Gallery property={p} onOpen={setLightbox} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: BedDouble, label: "Bedrooms", value: p.beds },
              { icon: Bath, label: "Bathrooms", value: p.baths },
              { icon: Maximize, label: "Living area", value: `${p.sizeM2} m²` },
              { icon: CalendarDays, label: "Year built", value: p.yearBuilt || "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4">
                <s.icon className="size-5 text-primary" />
                <p className="mt-3 text-xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-medium">About this home</h2>
          <p className="mt-3 leading-relaxed text-foreground/80">{p.description}</p>

          {p.features.length > 0 && (
            <>
              <h2 className="mt-10 text-2xl font-medium">Features</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <span className="grid size-6 place-items-center rounded-full bg-accent text-primary"><Check className="size-3.5" /></span>
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="mt-10 text-2xl font-medium">Location</h2>
          <p className="mt-1 text-sm text-muted-foreground">{p.neighborhood}, {p.city}</p>
          {hasCoords ? (
            <div className="mt-4 overflow-hidden rounded-2xl border shadow-card">
              <iframe title={`Map of ${p.title}`} src={mapSrc} className="h-96 w-full" loading="lazy" />
            </div>
          ) : (
            <div className="mt-4 grid h-40 place-items-center rounded-2xl border border-dashed text-sm text-muted-foreground">
              Exact map position not available for this listing
            </div>
          )}
          <a
            href={largeMapHref}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Open larger map
          </a>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <p className="eyebrow text-muted-foreground">Listed by</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-navy font-semibold text-navy-foreground">
                {p.agent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
              <div>
                <p className="font-semibold">{p.agent.name}</p>
                {!agency && <p className="text-sm text-muted-foreground">Private seller</p>}
                {agency && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    {agency.name} · <Star className="size-3.5 fill-highlight text-highlight" /> {agency.rating}
                  </p>
                )}
              </div>
            </div>
            <Button size="lg" className="mt-6 w-full" onClick={() => setContactOpen(true)}>
              <Mail /> Contact agent
            </Button>
            {p.agent.phone && (
              <Button asChild size="lg" variant="outline" className="mt-2 w-full">
                <a href={`tel:${p.agent.phone.replace(/\s/g, "")}`}><Phone /> {p.agent.phone}</a>
              </Button>
            )}
          </div>

          {p.listing === "buy" && (
            <div className="mt-4 rounded-2xl bg-navy p-6 text-navy-foreground">
              <Calculator className="size-5 text-highlight" />
              <p className="mt-3 font-display text-xl">Estimate your payment</p>
              <p className="mt-1 text-sm text-navy-muted">See what this home could cost per month.</p>
              <Button asChild variant="hero" className="mt-4 w-full">
                <Link to="/mortgage-calculator" search={{ price: p.priceUsd }}>Calculate mortgage</Link>
              </Button>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="text-3xl font-medium">You might also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => <PropertyCard key={s.id} property={s} />)}
          </div>
        </section>
      )}

      <Lightbox property={p} index={lightbox} onIndex={setLightbox} />
      <ContactDialog property={p} open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}

function Gallery({ property: p, onOpen }: { property: Property; onOpen: (i: number) => void }) {
  return (
    <div className="mt-6 grid gap-3 md:h-[520px] md:grid-cols-4 md:grid-rows-2">
      {p.images.map((id, i) => (
        <button
          key={id + i}
          type="button"
          onClick={() => onOpen(i)}
          className={
            "group relative overflow-hidden rounded-2xl " +
            (i === 0 ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto" : "hidden md:block " + (i === 3 ? "md:col-span-2" : ""))
          }
          aria-label={`Open photo ${i + 1}`}
        >
          <img
            src={img(id, i === 0 ? 1400 : 800)}
            alt={`${p.title} photo ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {i === 0 && (
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-md bg-card/95 px-3 py-1.5 text-sm font-semibold text-card-foreground">
              <Expand className="size-4" /> View all {p.images.length} photos
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Lightbox({ property: p, index, onIndex }: { property: Property; index: number | null; onIndex: (i: number | null) => void }) {
  const n = p.images.length;
  return (
    <Dialog open={index !== null} onOpenChange={(o) => !o && onIndex(null)}>
      <DialogContent className="max-w-5xl border-none bg-navy-deep p-3 text-navy-foreground sm:max-w-5xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{p.title} photos</DialogTitle>
          <DialogDescription>Photo gallery</DialogDescription>
        </DialogHeader>
        {index !== null && (
          <div className="relative">
            <img src={img(p.images[index], 1800)} alt={`${p.title} photo ${index + 1}`} className="max-h-[75vh] w-full rounded-lg object-contain" />
            <Button variant="on-navy" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 bg-navy-deep/60" onClick={() => onIndex((index - 1 + n) % n)} aria-label="Previous photo">
              <ChevronLeft />
            </Button>
            <Button variant="on-navy" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 bg-navy-deep/60" onClick={() => onIndex((index + 1) % n)} aria-label="Next photo">
              <ChevronRight />
            </Button>
            <div className="mt-3 flex justify-center gap-2">
              {p.images.map((id, i) => (
                <button key={id + i} onClick={() => onIndex(i)} className={"h-14 w-20 overflow-hidden rounded-md border-2 " + (i === index ? "border-highlight" : "border-transparent opacity-60")}>
                  <img src={img(id, 200, 140)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContactDialog({ property: p, open, onOpenChange }: { property: Property; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-medium">Contact {p.agent.name}</DialogTitle>
          <DialogDescription>About “{p.title}”. The agent usually replies within a day.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenChange(false);
            toast.success("Message sent", { description: `${p.agent.name} will get back to you soon.` });
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="c-name">Full name</Label><Input id="c-name" required /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" required /></div>
            <div className="space-y-1.5"><Label htmlFor="c-phone">Phone</Label><Input id="c-phone" type="tel" /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-msg">Message</Label>
            <Textarea id="c-msg" rows={4} required defaultValue={`Hello, I'm interested in ${p.title} and would like to arrange a viewing.`} />
          </div>
          <Button type="submit" size="lg" className="w-full">Send message</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
