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
  lat: number;
  lng: number;
  priceUsd: number; // total price for buy, monthly for rent
  sizeM2: number;
  beds: number;
  baths: number;
  yearBuilt: number;
  images: string[];
  description: string;
  features: string[];
  agencyId: string;
  agent: { name: string; phone: string; email: string };
}

export const img = (id: string | undefined, w = 1200, h?: number) =>
  `https://images.unsplash.com/photo-${id ?? ""}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ""}&q=80`;

export const agencies: Agency[] = [
  { id: "skyline-realty", name: "Skyline Realty Group", city: "New York", country: "United States", founded: 2004, rating: 4.9, agents: 86, phone: "+1 212 555 0148", email: "hello@skylinerealty.com", specialty: "Luxury condos & penthouses", logoInitials: "SR" },
  { id: "costa-luxe", name: "Costa Luxe Properties", city: "Marbella", country: "Spain", founded: 2011, rating: 4.8, agents: 34, phone: "+34 952 555 210", email: "info@costaluxe.es", specialty: "Mediterranean villas", logoInitials: "CL" },
  { id: "maison-co", name: "Maison & Co.", city: "Paris", country: "France", founded: 1998, rating: 4.7, agents: 52, phone: "+33 1 55 50 12 34", email: "contact@maisonco.fr", specialty: "Historic city apartments", logoInitials: "MC" },
  { id: "harbour-estates", name: "Harbour Estates", city: "Sydney", country: "Australia", founded: 2008, rating: 4.8, agents: 41, phone: "+61 2 5550 1290", email: "team@harbourestates.com.au", specialty: "Waterfront homes, Asia-Pacific", logoInitials: "HE" },
  { id: "kensington-rowe", name: "Kensington & Rowe", city: "London", country: "United Kingdom", founded: 1987, rating: 4.9, agents: 120, phone: "+44 20 5550 7781", email: "enquiries@kensingtonrowe.co.uk", specialty: "Prime residential, UK & Canada", logoInitials: "KR" },
  { id: "gulf-prime", name: "Gulf Prime Realty", city: "Dubai", country: "United Arab Emirates", founded: 2014, rating: 4.6, agents: 63, phone: "+971 4 555 0192", email: "sales@gulfprime.ae", specialty: "Beachfront & new developments", logoInitials: "GP" },
  { id: "alpine-coast", name: "Alpine & Coast", city: "Zermatt", country: "Switzerland", founded: 2002, rating: 4.9, agents: 18, phone: "+41 27 555 04 40", email: "stay@alpinecoast.ch", specialty: "Mountain chalets & seasonal rentals", logoInitials: "AC" },
];

export const properties: Property[] = [
  {
    id: "tribeca-skyline-penthouse",
    title: "Tribeca Skyline Penthouse",
    kind: "Apartment", listing: "buy",
    country: "United States", city: "New York", neighborhood: "Tribeca",
    lat: 40.7163, lng: -74.0086,
    priceUsd: 4_250_000, sizeM2: 210, beds: 3, baths: 3, yearBuilt: 2019,
    images: ["1545324418-cc1a3fa10c00", "1600607687939-ce8a6c25118c", "1484154218962-a197022b5858", "1512918728675-ed5a9ecdebfd"],
    description: "A full-floor penthouse with floor-to-ceiling windows framing the Hudson River and the downtown skyline. Wide-plank oak floors, a chef's kitchen with integrated appliances, and a private terrace make this a rare find in one of Manhattan's most sought-after neighborhoods.",
    features: ["Private terrace", "24/7 doorman", "Fitness center", "Floor-to-ceiling windows", "Central A/C", "Storage unit"],
    agencyId: "skyline-realty",
    agent: { name: "Rachel Kim", phone: "+1 212 555 0161", email: "rachel@skylinerealty.com" },
  },
  {
    id: "marbella-golden-mile-villa",
    title: "Golden Mile Contemporary Villa",
    kind: "Villa", listing: "buy",
    country: "Spain", city: "Marbella", neighborhood: "Golden Mile",
    lat: 36.5101, lng: -4.8825,
    priceUsd: 3_850_000, sizeM2: 520, beds: 5, baths: 5, yearBuilt: 2021,
    images: ["1613490493576-7fde63acd811", "1600573472550-8090b5e0745e", "1600210492486-724fe5c67fb0", "1512918728675-ed5a9ecdebfd"],
    description: "Clean architectural lines, an infinity pool and sweeping views to the Mediterranean. This newly built villa sits minutes from Puerto Banús with open-plan living spaces that flow onto sun-drenched terraces.",
    features: ["Infinity pool", "Sea views", "Home cinema", "Underfloor heating", "Smart home", "Double garage"],
    agencyId: "costa-luxe",
    agent: { name: "Javier Morales", phone: "+34 952 555 233", email: "javier@costaluxe.es" },
  },
  {
    id: "le-marais-haussmann-apartment",
    title: "Le Marais Haussmann Apartment",
    kind: "Apartment", listing: "rent",
    country: "France", city: "Paris", neighborhood: "Le Marais",
    lat: 48.859, lng: 2.3622,
    priceUsd: 6_800, sizeM2: 95, beds: 2, baths: 1, yearBuilt: 1885,
    images: ["1522708323590-d24dbb6b0267", "1493809842364-78817add7ffb", "1586023492125-27b2c045efd7", "1615874959474-d609969a20ed"],
    description: "A light-filled, fully furnished apartment on the third floor of a classic Haussmann building. Herringbone parquet, ornate mouldings and tall French windows overlooking a quiet cobbled street in the heart of the Marais.",
    features: ["Fully furnished", "Elevator", "Herringbone parquet", "Balcony", "Washer & dryer", "Fiber internet"],
    agencyId: "maison-co",
    agent: { name: "Camille Laurent", phone: "+33 1 55 50 12 40", email: "camille@maisonco.fr" },
  },
  {
    id: "mosman-harbour-family-home",
    title: "Mosman Harbour Family Home",
    kind: "House", listing: "buy",
    country: "Australia", city: "Sydney", neighborhood: "Mosman",
    lat: -33.829, lng: 151.244,
    priceUsd: 3_950_000, sizeM2: 340, beds: 4, baths: 3, yearBuilt: 2015,
    images: ["1564013799919-ab600027ffc6", "1560448204-e02f11c3d0e2", "1484154218962-a197022b5858", "1505691938895-1758d7feb511"],
    description: "A relaxed coastal home on a leafy street, a short walk to Balmoral Beach. Generous indoor-outdoor living wraps around a saltwater pool and landscaped gardens — ideal for family life by the harbour.",
    features: ["Saltwater pool", "Landscaped garden", "Walk to beach", "Solar panels", "Two-car garage", "Outdoor kitchen"],
    agencyId: "harbour-estates",
    agent: { name: "Liam O'Connor", phone: "+61 2 5550 1311", email: "liam@harbourestates.com.au" },
  },
  {
    id: "canggu-tropical-villa",
    title: "Canggu Tropical Pool Villa",
    kind: "Villa", listing: "rent",
    country: "Indonesia", city: "Bali", neighborhood: "Canggu",
    lat: -8.6478, lng: 115.1385,
    priceUsd: 4_500, sizeM2: 280, beds: 3, baths: 3, yearBuilt: 2020,
    images: ["1499793983690-e29da59ef1c2", "1512917774080-9991f1c4c750", "1615874959474-d609969a20ed", "1600210492486-724fe5c67fb0"],
    description: "A serene open-air villa surrounded by palms, five minutes from Echo Beach. Private pool, tropical garden and weekly housekeeping included — perfect for long stays and remote work.",
    features: ["Private pool", "Housekeeping included", "Tropical garden", "Workspace", "Near the beach", "Starlink internet"],
    agencyId: "harbour-estates",
    agent: { name: "Putu Ayu Dewi", phone: "+62 361 555 0198", email: "ayu@harbourestates.com.au" },
  },
  {
    id: "kensington-garden-flat",
    title: "Kensington Garden Square Flat",
    kind: "Apartment", listing: "buy",
    country: "United Kingdom", city: "London", neighborhood: "Kensington",
    lat: 51.499, lng: -0.1938,
    priceUsd: 2_150_000, sizeM2: 120, beds: 2, baths: 2, yearBuilt: 1890,
    images: ["1502672260266-1c1ef2d93688", "1493809842364-78817add7ffb", "1484154218962-a197022b5858", "1512918728675-ed5a9ecdebfd"],
    description: "An elegant raised-ground-floor flat in a white stucco Victorian terrace, with access to a private communal garden square. Refurbished throughout while keeping original sash windows and fireplaces.",
    features: ["Communal garden", "Original fireplaces", "Porter", "Share of freehold", "Near Underground", "Wine cellar"],
    agencyId: "kensington-rowe",
    agent: { name: "Oliver Bennett", phone: "+44 20 5550 7790", email: "oliver@kensingtonrowe.co.uk" },
  },
  {
    id: "oakville-lakeside-house",
    title: "Oakville Lakeside Residence",
    kind: "House", listing: "buy",
    country: "Canada", city: "Toronto", neighborhood: "Oakville",
    lat: 43.4675, lng: -79.6877,
    priceUsd: 1_480_000, sizeM2: 260, beds: 4, baths: 3, yearBuilt: 2012,
    images: ["1605276374104-dee2a0ed3cd6", "1560448204-e02f11c3d0e2", "1505691938895-1758d7feb511", "1484154218962-a197022b5858"],
    description: "A classic brick family home on a quiet crescent near Lake Ontario. Finished basement, a bright eat-in kitchen and top-rated schools nearby. Just 30 minutes from downtown Toronto.",
    features: ["Finished basement", "Two-car garage", "Top-rated schools", "Fireplace", "Large backyard", "Near GO Train"],
    agencyId: "kensington-rowe",
    agent: { name: "Emily Tremblay", phone: "+1 416 555 0127", email: "emily@kensingtonrowe.co.uk" },
  },
  {
    id: "palm-jumeirah-signature-villa",
    title: "Palm Jumeirah Signature Villa",
    kind: "Villa", listing: "buy",
    country: "United Arab Emirates", city: "Dubai", neighborhood: "Palm Jumeirah",
    lat: 25.1124, lng: 55.139,
    priceUsd: 7_900_000, sizeM2: 650, beds: 6, baths: 7, yearBuilt: 2022,
    images: ["1600596542815-ffad4c1539a9", "1600566753086-00f18fb6b3ea", "1600573472550-8090b5e0745e", "1512918728675-ed5a9ecdebfd"],
    description: "A frond-front villa with private beach access and unobstructed views of the Dubai Marina skyline. Double-height living spaces, a temperature-controlled pool and staff quarters complete this exceptional residence.",
    features: ["Private beach", "Temperature-controlled pool", "Skyline views", "Staff quarters", "Elevator", "Rooftop lounge"],
    agencyId: "gulf-prime",
    agent: { name: "Omar Al Mansoori", phone: "+971 4 555 0201", email: "omar@gulfprime.ae" },
  },
  {
    id: "cascais-ocean-view-house",
    title: "Cascais Ocean View House",
    kind: "House", listing: "buy",
    country: "Portugal", city: "Lisbon", neighborhood: "Cascais",
    lat: 38.6979, lng: -9.4215,
    priceUsd: 1_950_000, sizeM2: 310, beds: 4, baths: 4, yearBuilt: 2018,
    images: ["1580587771525-78b9dba3b914", "1600607687939-ce8a6c25118c", "1600210492486-724fe5c67fb0", "1615874959474-d609969a20ed"],
    description: "A modern family house on the hills above Cascais with Atlantic views from every level. Private pool, mature garden and a short drive to Lisbon city center and the beaches of the Estoril coast.",
    features: ["Ocean views", "Private pool", "Garden", "Solar heating", "Home office", "Gated community"],
    agencyId: "costa-luxe",
    agent: { name: "Inês Carvalho", phone: "+351 21 555 0174", email: "ines@costaluxe.es" },
  },
  {
    id: "zermatt-matterhorn-chalet",
    title: "Matterhorn View Chalet",
    kind: "House", listing: "rent",
    country: "Switzerland", city: "Zermatt", neighborhood: "Winkelmatten",
    lat: 46.0207, lng: 7.7491,
    priceUsd: 12_500, sizeM2: 220, beds: 4, baths: 3, yearBuilt: 2010,
    images: ["1568605114967-8130f3a36994", "1505691938895-1758d7feb511", "1512918728675-ed5a9ecdebfd", "1484154218962-a197022b5858"],
    description: "A warm timber chalet with direct views of the Matterhorn, a short walk from the ski lifts. Wood-burning fireplace, sauna and a sunny terrace for après-ski evenings. Available for seasonal or annual lease.",
    features: ["Matterhorn views", "Sauna", "Ski-in access", "Fireplace", "Boot room", "Fully furnished"],
    agencyId: "alpine-coast",
    agent: { name: "Lukas Brunner", phone: "+41 27 555 04 52", email: "lukas@alpinecoast.ch" },
  },
  {
    id: "prenzlauer-berg-loft",
    title: "Prenzlauer Berg Altbau Loft",
    kind: "Apartment", listing: "rent",
    country: "Germany", city: "Berlin", neighborhood: "Prenzlauer Berg",
    lat: 52.539, lng: 13.424,
    priceUsd: 2_900, sizeM2: 85, beds: 2, baths: 1, yearBuilt: 1905,
    images: ["1586023492125-27b2c045efd7", "1502672260266-1c1ef2d93688", "1615874959474-d609969a20ed", "1484154218962-a197022b5858"],
    description: "A characterful Altbau apartment with 3.5 m ceilings, restored floorboards and a balcony over a tree-lined street. Close to Kollwitzplatz cafés, the weekend market and excellent transport links.",
    features: ["High ceilings", "Balcony", "Fitted kitchen", "Bike storage", "Near U-Bahn", "Pets allowed"],
    agencyId: "maison-co",
    agent: { name: "Jonas Weber", phone: "+49 30 5550 1287", email: "jonas@maisonco.fr" },
  },
  {
    id: "hollywood-hills-modern-house",
    title: "Hollywood Hills Modern Retreat",
    kind: "House", listing: "rent",
    country: "United States", city: "Los Angeles", neighborhood: "Hollywood Hills",
    lat: 34.118, lng: -118.34,
    priceUsd: 14_000, sizeM2: 380, beds: 4, baths: 5, yearBuilt: 2017,
    images: ["1600585154340-be6161a56a0c", "1600566753086-00f18fb6b3ea", "1600607687939-ce8a6c25118c", "1484154218962-a197022b5858"],
    description: "A private, gated hillside home with canyon and city-light views. Disappearing glass walls open the living area to a pool deck, while the primary suite offers a spa bath and walk-in closet.",
    features: ["City-light views", "Pool & spa", "Gated driveway", "Walk-in closets", "EV charger", "Home gym"],
    agencyId: "skyline-realty",
    agent: { name: "Marcus Reed", phone: "+1 310 555 0119", email: "marcus@skylinerealty.com" },
  },
];

export const countries = Array.from(new Set(properties.map((p) => p.country))).sort();

export function citiesFor(country?: string) {
  return Array.from(
    new Set(properties.filter((p) => !country || p.country === country).map((p) => p.city)),
  ).sort();
}

export function getProperty(id: string) {
  return properties.find((p) => p.id === id);
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
