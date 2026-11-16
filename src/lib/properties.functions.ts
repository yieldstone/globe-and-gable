import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ListingType, Property, PropertyKind } from "./properties";

const PHOTOS_BUCKET = "listing-photos";
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

type Row = Database["public"]["Tables"]["properties"]["Row"];

// Public read-only client for SSR: anyone may read listings (RLS: public SELECT).
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

// Uploaded photos live in a private bucket (workspace policy blocks public buckets), so they
// are shown through signed links anyone can open. Sample photos are stored as full URLs.
async function toProperties(rows: Row[]): Promise<Property[]> {
  if (rows.length === 0) return [];
  const paths = Array.from(new Set(rows.flatMap((r) => r.images).filter((i) => !i.startsWith("http"))));
  const urlFor = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await publicClient().storage.from(PHOTOS_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
    const serverBase = (process.env["SUPABASE_URL"] ?? "").replace(/\/+$/, "");
    const publicBase = (import.meta.env.VITE_SUPABASE_URL ?? process.env["VITE_SUPABASE_URL"] ?? serverBase).replace(/\/+$/, "");
    for (const item of data ?? []) {
      if (!item.path || !item.signedUrl) continue;
      const absolute = item.signedUrl.startsWith("http") ? item.signedUrl : `${serverBase}/storage/v1${item.signedUrl}`;
      urlFor.set(item.path, serverBase ? absolute.replace(serverBase, publicBase) : absolute);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind as PropertyKind,
    listing: r.listing_type as ListingType,
    country: r.country,
    city: r.city,
    neighborhood: r.neighborhood || r.city,
    lat: r.lat,
    lng: r.lng,
    priceUsd: Number(r.price_usd),
    sizeM2: r.size_m2,
    beds: r.beds,
    baths: r.baths,
    yearBuilt: r.year_built ?? 0,
    images: r.images.map((i) => (i.startsWith("http") ? i : urlFor.get(i))).filter((u): u is string => !!u),
    description: r.description,
    features: r.features,
    agencyId: r.agency_id ?? undefined,
    agent: { name: r.seller_name, phone: r.seller_phone ?? undefined },
    userId: r.user_id,
  }));
}

export const getProperties = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return toProperties(data ?? []);
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getPropertyById = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (typeof input?.id !== "string") throw new Error("Invalid id");
    return { id: input.id };
  })
  .handler(async ({ data }) => {
    if (!UUID.test(data.id)) return null;
    const { data: row, error } = await publicClient().from("properties").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const [property] = await toProperties([row]);
    return property ?? null;
  });
