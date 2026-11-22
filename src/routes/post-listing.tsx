import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, LogIn, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/components/site/currency-context";
import { useAuth } from "@/hooks/use-auth";
import { AgencyPricing } from "@/components/site/agency-pricing";
import { supabase } from "@/integrations/supabase/client";
import { toSquareMeters } from "@/lib/units";
import { AMENITIES, type Amenity } from "@/lib/properties";
import { convertToUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/post-listing")({
  head: () => ({
    meta: [
      { title: "Post a property listing | Globe And Gable" },
      { name: "description", content: "List your apartment, house or villa for sale or rent and reach buyers and tenants across the USA, Dubai and Abu Dhabi." },
      { property: "og:title", content: "Post a property listing | Globe And Gable" },
      { property: "og:description", content: "Reach buyers and tenants across the USA, Dubai and Abu Dhabi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostListingPage,
});

const MAX_PHOTOS = 12;
const MAX_BYTES = 10 * 1024 * 1024;

type Photo = { file: File; url: string };

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );
    clearTimeout(t);
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  } catch {
    return null;
  }
}

function PostListingPage() {
  const { user, loading } = useAuth();

  return (
    <>
      <section className="bg-navy pb-16 pt-12 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="eyebrow text-highlight">For owners & agents</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Post a listing</h1>
          <p className="mt-3 max-w-xl text-navy-muted">Reach buyers and tenants across the USA, Dubai and Abu Dhabi.</p>
        </div>
      </section>
      {loading ? (
        <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
      ) : user ? (
        <ListingForm userId={user.id} />
      ) : (
        <div className="mx-auto -mt-8 max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border bg-card p-10 text-center shadow-card">
            <LogIn className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-2xl font-medium">Sign in to post a listing</h2>
            <p className="mt-2 text-muted-foreground">Create a free account so you can save and manage your listings.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild size="lg"><Link to="/auth" search={{ redirect: "/post-listing", mode: "login" }}>Log in</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ redirect: "/post-listing", mode: "signup" }}>Sign up</Link></Button>
            </div>
          </div>
        </div>
      )}
      <AgencyPricing />
    </>
  );
}

function ListingForm({ userId }: { userId: string }) {
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listing, setListing] = useState<"buy" | "rent">("buy");
  const [kind, setKind] = useState("Apartment");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (photos.length === 0) { toast.error("Add at least one photo"); return; }
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim();
    const num = (k: string) => (str(k) === "" ? null : Number(str(k)));

    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const paths: string[] = [];
      for (const [i, p] of photos.entries()) {
        const ext = (p.file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${id}/${i + 1}.${ext}`;
        const { error } = await supabase.storage.from("listing-photos").upload(path, p.file, { contentType: p.file.type, upsert: false });
        if (error) throw new Error(`Photo ${i + 1} could not be uploaded: ${error.message}`);
        paths.push(path);
      }

      const neighborhood = str("hood");
      const coords = await geocode([neighborhood, str("city"), str("country")].filter(Boolean).join(", "));

      const { error } = await supabase.from("properties").insert({
        id,
        user_id: userId,
        title: str("title"),
        kind,
        listing_type: listing,
        country: str("country"),
        city: str("city"),
        neighborhood: neighborhood || null,
        price_usd: Math.round(convertToUsd(Number(str("price")), currency)),
        size_m2: Math.max(1, Math.round(toSquareMeters(Number(str("size"))))),
        features: amenities,
        beds: Number(str("beds")),
        baths: Number(str("baths")),
        year_built: num("year"),
        description: str("desc"),
        images: paths,
        seller_name: str("name"),
        seller_phone: str("phone") || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      if (error) {
        await supabase.storage.from("listing-photos").remove(paths);
        throw new Error(error.message);
      }

      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Your listing is live");
      navigate({ to: "/properties/$propertyId", params: { propertyId: id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mx-auto -mt-8 max-w-4xl space-y-6 px-4 sm:px-6" onSubmit={onSubmit}>
      <Section title="Listing type">
        <div className="grid grid-cols-2 gap-3">
          {(["buy", "rent"] as const).map((t) => {
            const active = listing === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setListing(t)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40",
                )}
              >
                <p className="font-semibold">{t === "buy" ? "Sell" : "Rent out"}</p>
                <p className={cn("text-sm", active ? "text-primary-foreground" : "text-muted-foreground")}>
                  {t === "buy" ? "One-time sale price" : "Monthly rent"}
                </p>
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Property type">
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Penthouse">Penthouse</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label={`${listing === "buy" ? "Price" : "Monthly rent"} (${currency})`} htmlFor="price">
            <Input id="price" name="price" type="number" min={1} required placeholder={listing === "buy" ? "850000" : "3200"} />
          </F>
        </div>
      </Section>

      <Section title="Details">
        <F label="Listing title" htmlFor="title"><Input id="title" name="title" required minLength={3} maxLength={120} placeholder="Bright 2-bedroom apartment with balcony" /></F>
        <div className="grid gap-4 sm:grid-cols-4">
          <F label="Size (sq ft)" htmlFor="size"><Input id="size" name="size" type="number" min={1} max={1076380} required /></F>
          <F label="Bedrooms" htmlFor="beds"><Input id="beds" name="beds" type="number" min={0} max={100} required /></F>
          <F label="Bathrooms" htmlFor="baths"><Input id="baths" name="baths" type="number" min={0} max={100} required /></F>
          <F label="Year built" htmlFor="year"><Input id="year" name="year" type="number" min={1500} max={2100} /></F>
        </div>
        <F label="Description" htmlFor="desc"><Textarea id="desc" name="desc" rows={5} required minLength={10} maxLength={5000} placeholder="Describe the home, neighborhood and what makes it special." /></F>
      </Section>

      <Section title="Amenities">
        <div className="flex flex-wrap gap-2">{AMENITIES.map((a) => <Button key={a} type="button" variant={amenities.includes(a) ? "default" : "outline"} aria-pressed={amenities.includes(a)} onClick={() => setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])}>{a}</Button>)}</div>
      </Section>

      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-3">
          <F label="Country" htmlFor="country"><Input id="country" name="country" required minLength={2} maxLength={60} /></F>
          <F label="City" htmlFor="city"><Input id="city" name="city" required maxLength={80} /></F>
          <F label="Neighborhood" htmlFor="hood"><Input id="hood" name="hood" maxLength={80} /></F>
        </div>
      </Section>

      <Section title="Photos">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            const tooBig = files.filter((f) => f.size > MAX_BYTES);
            if (tooBig.length) toast.error("Photos must be 10 MB or smaller");
            const ok = files.filter((f) => f.size <= MAX_BYTES).map((file) => ({ file, url: URL.createObjectURL(file) }));
            setPhotos((prev) => [...prev, ...ok].slice(0, MAX_PHOTOS));
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p, i) => (
            <div key={p.url} className="relative aspect-[4/3] overflow-hidden rounded-xl border">
              <img src={p.url} alt={p.file.name} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(p.url);
                  setPhotos((prev) => prev.filter((_, j) => j !== i));
                }}
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-card/90 text-card-foreground"
                aria-label="Remove photo"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <ImagePlus className="size-6" /> Add photos
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Up to {MAX_PHOTOS} photos, 10 MB each. The first photo is the cover.</p>
      </Section>

      <Section title="Contact shown on your listing">
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Name" htmlFor="name"><Input id="name" name="name" required maxLength={80} /></F>
          <F label="Phone (international format, e.g. +971…)" htmlFor="phone"><Input id="phone" name="phone" type="tel" maxLength={40} /></F>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (<><Loader2 className="animate-spin" /> Publishing…</>) : "Publish listing"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-xl font-medium">{title}</h2>
      {children}
    </section>
  );
}

function F({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
