export type ListingType = "buy" | "rent";
export type PropertyKind = "Apartment" | "House" | "Villa";

export interface Agency {
  id: string;
  name: string;
  city: string;
  country: string;
  founded: number;
  rating: number;
  agents: number;
  phone: string;
  email: string;
  specialty: string;
  logoInitials: string;
}

export interface Property {
  id: string;
  title: string;
  kind: PropertyKind;
  listing: ListingType;
  country: string;
  city: string;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
  priceUsd: number; // total price for buy, monthly for rent
  sizeM2: number;
  beds: number;
  baths: number;
  yearBuilt: number;
  images: string[];
  description: string;
  features: string[];
  agencyId?: string | undefined;
  agent: { name: string; phone?: string | undefined; email?: string | undefined };
  /** Owner account for listings posted by users; null for partner-agency samples. */
  userId: string | null;
}

/** Accepts a complete image URL (as stored in the database) or a bare Unsplash photo id. */
export const img = (id: string | undefined, w = 1200, h?: number) =>
  id?.startsWith("http")
    ? id
    : `https://images.unsplash.com/photo-${id ?? ""}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=80`;

export const agencies: Agency[] = [
  { id: "skyline-realty", name: "Skyline Realty Group", city: "New York", country: "United States", founded: 2004, rating: 4.9, agents: 86, phone: "+1 212 555 0148", email: "hello@skylinerealty.com", specialty: "Luxury condos & penthouses", logoInitials: "SR" },
  { id: "costa-luxe", name: "Costa Luxe Properties", city: "Marbella", country: "Spain", founded: 2011, rating: 4.8, agents: 34, phone: "+34 952 555 210", email: "info@costaluxe.es", specialty: "Mediterranean villas", logoInitials: "CL" },
  { id: "maison-co", name: "Maison & Co.", city: "Paris", country: "France", founded: 1998, rating: 4.7, agents: 52, phone: "+33 1 55 50 12 34", email: "contact@maisonco.fr", specialty: "Historic city apartments", logoInitials: "MC" },
  { id: "harbour-estates", name: "Harbour Estates", city: "Sydney", country: "Australia", founded: 2008, rating: 4.8, agents: 41, phone: "+61 2 5550 1290", email: "team@harbourestates.com.au", specialty: "Waterfront homes, Asia-Pacific", logoInitials: "HE" },
  { id: "kensington-rowe", name: "Kensington & Rowe", city: "London", country: "United Kingdom", founded: 1987, rating: 4.9, agents: 120, phone: "+44 20 5550 7781", email: "enquiries@kensingtonrowe.co.uk", specialty: "Prime residential, UK & Canada", logoInitials: "KR" },
  { id: "gulf-prime", name: "Gulf Prime Realty", city: "Dubai", country: "United Arab Emirates", founded: 2014, rating: 4.6, agents: 63, phone: "+971 4 555 0192", email: "sales@gulfprime.ae", specialty: "Beachfront & new developments", logoInitials: "GP" },
  { id: "alpine-coast", name: "Alpine & Coast", city: "Zermatt", country: "Switzerland", founded: 2002, rating: 4.9, agents: 18, phone: "+41 27 555 04 40", email: "stay@alpinecoast.ch", specialty: "Mountain chalets & seasonal rentals", logoInitials: "AC" },
];

export function countriesIn(list: Property[]) {
  return Array.from(new Set(list.map((p) => p.country))).sort();
}

export function citiesFor(country: string | undefined, list: Property[]) {
  return Array.from(
    new Set(list.filter((p) => !country || p.country === country).map((p) => p.city)),
  ).sort();
}

export function getAgency(id: string) {
  return agencies.find((a) => a.id === id);
}

export interface PropertyFilters {
  country?: string | undefined;
  city?: string | undefined;
  type?: ListingType | undefined;
  kind?: PropertyKind | undefined;
  minPrice?: number | undefined; // USD
  maxPrice?: number | undefined; // USD
  minSize?: number | undefined; // m²
}

export function filterProperties(list: Property[], f: PropertyFilters) {
  return list.filter(
    (p) =>
      (!f.country || p.country === f.country) &&
      (!f.city || p.city === f.city) &&
      (!f.type || p.listing === f.type) &&
      (!f.kind || p.kind === f.kind) &&
      (f.minPrice == null || p.priceUsd >= f.minPrice) &&
      (f.maxPrice == null || p.priceUsd <= f.maxPrice) &&
      (f.minSize == null || p.sizeM2 >= f.minSize),
  );
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

export function parseFilters(search: Record<string, unknown>): PropertyFilters {
  const type = search["type"] === "buy" || search["type"] === "rent" ? search["type"] : undefined;
  const kind =
    search["kind"] === "Apartment" || search["kind"] === "House" || search["kind"] === "Villa"
      ? search["kind"]
      : undefined;
  return {
    country: str(search["country"]),
    city: str(search["city"]),
    type,
    kind,
    minPrice: num(search["minPrice"]),
    maxPrice: num(search["maxPrice"]),
    minSize: num(search["minSize"]),
  };
}
