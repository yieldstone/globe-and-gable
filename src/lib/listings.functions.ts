import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Property, PropertyKind, ListingType } from "./properties";

export const LISTING_PHOTOS_BUCKET = "listing-photos";
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

type Row = Database["public"]["Tables"]["listings"]["Row"];

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

// The storage bucket is private (workspace policy), so photos are served through signed links
// that anyone can open. Signed URLs come back on the server runtime URL; rewrite them to the
// browser-facing backend URL so visitors can load them.
async function toProperties(rows: Row[]): Promise<Property[]> {
  if (rows.length === 0) return [];
  const supabase = publicClient();
  const paths = Array.from(new Set(rows.flatMap((r) => r.image_paths)));
  const { data } = await supabase.storage.from(LISTING_PHOTOS_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  const serverBase = (process.env["SUPABASE_URL"] ?? "").replace(/\/+$/, "");
  const publicBase = (process.env["VITE_SUPABASE_URL"] ?? import.meta.env.VITE_SUPABASE_URL ?? serverBase).replace(/\/+$/, "");
  const urlFor = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      const absolute = item.signedUrl.startsWith("http") ? item.signedUrl : `${serverBase}/storage/v1${item.signedUrl}`;
      urlFor.set(item.path, absolute.replace(serverBase, publicBase));
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
    images: r.image_paths.map((p) => urlFor.get(p)).filter((u): u is string => !!u),
    description: r.description,
    features: [],
    agent: { name: r.seller_name },
    userSubmitted: true,
  }));
}

export const getSubmittedListings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return toProperties(data ?? []);
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getSubmittedListing = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (typeof input?.id !== "string") throw new Error("Invalid id");
    return { id: input.id };
  })
  .handler(async ({ data }) => {
    if (!UUID.test(data.id)) return null;
    const { data: row, error } = await publicClient().from("listings").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const [property] = await toProperties([row]);
    return property ?? null;
  });
