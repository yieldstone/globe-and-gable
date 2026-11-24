import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bath, BedDouble, Mail, MapPin, Maximize, MessageCircle } from "lucide-react";
import { formatArea } from "@/lib/units";
import { listingWhatsappLink } from "@/lib/whatsapp";
import { FeaturedBadge, VerifiedAgentBadge } from "./trust-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { img, type Property } from "@/lib/properties";
import { useCurrency } from "./currency-context";

export function PropertyCard({ property: p }: { property: Property }) {
  const { price } = useCurrency();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const whatsapp = origin ? listingWhatsappLink(p, price(p.priceUsd), `${origin}/properties/${p.id}`) : null;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
      <Link to="/properties/$propertyId" params={{ propertyId: p.id }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={img(p.images[0], 800, 600)}
            alt={p.title}
            loading="lazy"
            width={800}
            height={600}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-card-image-overlay" />
          <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-2">
            <Badge variant={p.listing === "buy" ? "default" : "highlight"}>
              {p.listing === "buy" ? "For sale" : "For rent"}
            </Badge>
            {p.featured && <FeaturedBadge />}
            <Badge variant="overlay">{p.kind}</Badge>
          </div>
          <p className="absolute bottom-3 left-4 font-display text-2xl font-semibold text-navy-foreground">
            {price(p.priceUsd)}
            {p.listing === "rent" && <span className="ml-1 font-sans text-sm font-medium">/ month</span>}
          </p>
        </div>
        <div className="p-5 pb-0">
          {p.verifiedAgent && <div className="mb-2"><VerifiedAgentBadge /></div>}
          <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">{p.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {p.neighborhood}, {p.city}, {p.country}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-sm text-foreground/80">
            <span className="flex items-center gap-1.5"><BedDouble className="size-4 text-primary" />{p.beds} bd</span>
            <span className="flex items-center gap-1.5"><Bath className="size-4 text-primary" />{p.baths} ba</span>
            <span className="flex items-center gap-1.5"><Maximize className="size-4 text-primary" />{formatArea(p.sizeM2)}</span>
          </div>
        </div>
      </Link>
      <div className="mt-auto grid grid-cols-2 gap-2 p-5 pt-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/properties/$propertyId" params={{ propertyId: p.id }}><Mail />Inquire</Link>
        </Button>
        {whatsapp ? (
          <Button asChild variant="whatsapp" size="sm">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle />WhatsApp</a>
          </Button>
        ) : (
          <Button asChild variant="whatsapp" size="sm">
            <Link to="/properties/$propertyId" params={{ propertyId: p.id }}><MessageCircle />WhatsApp</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
