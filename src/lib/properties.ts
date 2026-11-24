export type ListingType = "buy" | "rent";
export type PropertyKind = "Apartment" | "House" | "Villa" | "Penthouse" | "Townhouse";

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
  featured?: boolean;
  verifiedAgent?: boolean;
}

/** Photos are stored as complete (signed) URLs; size hints are kept for call-site compatibility. */
export const img = (url: string | undefined, _w?: number, _h?: number) => url ?? "";

export const agencies: Agency[] = [
  { id: "skyline-realty", name: "Skyline Realty Group", city: "New York", country: "United States", founded: 2004, rating: 4.9, agents: 86, phone: "+1 212 555 0148", email: "hello@skylinerealty.com", specialty: "Luxury condos & penthouses", logoInitials: "SR" },
  { id: "costa-luxe", name: "Biscayne Luxe Properties", city: "Miami", country: "United States", founded: 2011, rating: 4.8, agents: 34, phone: "+1 305 555 0121", email: "info@biscayneluxe.example", specialty: "Oceanfront condos & villas", logoInitials: "BL" },
  { id: "maison-co", name: "Manhattan & Co.", city: "New York", country: "United States", founded: 1998, rating: 4.7, agents: 52, phone: "+1 212 555 0134", email: "contact@manhattanco.example", specialty: "City apartments & townhouses", logoInitials: "MC" },
  { id: "harbour-estates", name: "Saadiyat Harbour Estates", city: "Abu Dhabi", country: "United Arab Emirates", founded: 2008, rating: 4.8, agents: 41, phone: "+971 2 555 0129", email: "team@saadiyatharbour.example", specialty: "Island villas & waterfront residences", logoInitials: "SH" },
  { id: "kensington-rowe", name: "Pacific & Rowe", city: "Los Angeles", country: "United States", founded: 1987, rating: 4.9, agents: 120, phone: "+1 310 555 0178", email: "enquiries@pacificrowe.example", specialty: "Beverly Hills estates & coastal homes", logoInitials: "PR" },
  { id: "gulf-prime", name: "Gulf Prime Realty", city: "Dubai", country: "United Arab Emirates", founded: 2014, rating: 4.6, agents: 63, phone: "+971 4 555 0192", email: "sales@gulfprime.ae", specialty: "Beachfront & new developments", logoInitials: "GP" },
  { id: "alpine-coast", name: "Yas & Coast", city: "Abu Dhabi", country: "United Arab Emirates", founded: 2002, rating: 4.9, agents: 18, phone: "+971 2 555 0140", email: "hello@yasandcoast.example", specialty: "Yas Island townhouses & luxury rentals", logoInitials: "YC" },
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

export const REGIONS = ["USA", "Dubai", "Abu Dhabi"] as const;
export type Region = (typeof REGIONS)[number];
export const AMENITIES = ["Pool", "Sea View", "Gym", "Furnished"] as const;
export type Amenity = (typeof AMENITIES)[number];

export interface PropertyFilters {
  region?: Region | undefined;
  bedrooms?: number | undefined;
  amenities?: Amenity[] | undefined;
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
      (!f.region || regionFor(p) === f.region) &&
      (f.bedrooms == null || p.beds >= f.bedrooms) &&
      (!f.amenities?.length || f.amenities.every((a) => hasAmenity(p, a))) &&
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
    ["Apartment", "House", "Villa", "Penthouse", "Townhouse"].includes(String(search["kind"]))
      ? search["kind"] as PropertyKind
      : undefined;
  return {
    region: REGIONS.find((r) => r === search["region"]),
    bedrooms: num(search["bedrooms"]),
    amenities: AMENITIES.filter((a) => (Array.isArray(search["amenities"]) ? search["amenities"] : String(search["amenities"] ?? "").split(",")).includes(a)),
    country: str(search["country"]),
    city: str(search["city"]),
    type,
    kind,
    minPrice: num(search["minPrice"]),
    maxPrice: num(search["maxPrice"]),
    minSize: num(search["minSize"]),
  };
}


export function regionFor(p: Pick<Property, "country" | "city">): Region | undefined {
  if (["united states", "united states of america", "usa", "us"].includes(p.country.trim().toLowerCase())) return "USA";
  if (!["united arab emirates", "uae"].includes(p.country.trim().toLowerCase())) return undefined;
  const city = p.city.trim().toLowerCase();
  return city === "dubai" ? "Dubai" : city === "abu dhabi" ? "Abu Dhabi" : undefined;
}

export function hasAmenity(p: Pick<Property, "features">, amenity: Amenity) {
  const patterns: Record<Amenity, RegExp> = {
    Pool: /\bpool\b/i,
    "Sea View": /\b(sea|ocean) views?\b/i,
    Gym: /\b(gym|fitness cent(er|re))\b/i,
    Furnished: /\b(furnished)\b/i,
  };
  return p.features.some((f) => !/\b(no|not|unfurnished)\b/i.test(f) && patterns[amenity].test(f));
}

export type PropertySort = "featured" | "price-asc" | "price-desc" | "size-desc";
export function sortProperties(list: Property[], sort: PropertySort = "featured") {
  return [...list].sort((a, b) => {
    const priority = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (priority) return priority;
    if (sort === "price-asc") return a.priceUsd - b.priceUsd;
    if (sort === "price-desc") return b.priceUsd - a.priceUsd;
    if (sort === "size-desc") return b.sizeM2 - a.sizeM2;
    return 0;
  });
}
