import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/components/site/currency-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/post-listing")({
  head: () => ({
    meta: [
      { title: "Post a property listing | Atlas Estates" },
      { name: "description", content: "List your apartment, house or villa for sale or rent and reach buyers and tenants worldwide." },
      { property: "og:title", content: "Post a property listing | Atlas Estates" },
      { property: "og:description", content: "Reach buyers and tenants worldwide in a few minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostListingPage,
});

function PostListingPage() {
  const { currency } = useCurrency();
  const [listing, setListing] = useState<"buy" | "rent">("buy");
  const [photos, setPhotos] = useState<{ name: string; url: string }[]>([]);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" />
        <h1 className="mt-5 text-3xl font-medium">Listing submitted for review</h1>
        <p className="mt-3 text-muted-foreground">“{submitted}” will be reviewed by our team. We'll email you once it's live.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => { setSubmitted(null); setPhotos([]); }}>Post another</Button>
          <Button asChild variant="outline"><Link to="/properties">Browse properties</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="bg-navy pb-16 pt-12 text-navy-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="eyebrow text-highlight">For owners & agents</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Post a listing</h1>
          <p className="mt-3 max-w-xl text-navy-muted">Reach buyers and tenants in more than 10 countries.</p>
        </div>
      </section>

      <form
        className="mx-auto -mt-8 max-w-4xl space-y-6 px-4 sm:px-6"
        onSubmit={(e) => {
          e.preventDefault();
          const title = String(new FormData(e.currentTarget).get("title") ?? "Your listing");
          toast.success("Listing submitted");
          setSubmitted(title);
          window.scrollTo({ top: 0 });
        }}
      >
        <Section title="Listing type">
          <div className="grid grid-cols-2 gap-3">
            {(["buy", "rent"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setListing(t)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-colors",
                  listing === t ? "border-primary bg-accent" : "border-border hover:border-primary/40",
                )}
              >
                <p className="font-semibold">{t === "buy" ? "Sell" : "Rent out"}</p>
                <p className="text-sm text-muted-foreground">{t === "buy" ? "One-time sale price" : "Monthly rent"}</p>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Property type">
              <Select name="kind" defaultValue="Apartment">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label={`${listing === "buy" ? "Price" : "Monthly rent"} (${currency})`} htmlFor="price">
              <Input id="price" name="price" type="number" min={1} required placeholder={listing === "buy" ? "850000" : "3200"} />
            </F>
          </div>
        </Section>

        <Section title="Details">
          <F label="Listing title" htmlFor="title"><Input id="title" name="title" required placeholder="Bright 2-bedroom apartment with balcony" /></F>
          <div className="grid gap-4 sm:grid-cols-4">
            <F label="Size (m²)" htmlFor="size"><Input id="size" name="size" type="number" min={1} required /></F>
            <F label="Bedrooms" htmlFor="beds"><Input id="beds" name="beds" type="number" min={0} required /></F>
            <F label="Bathrooms" htmlFor="baths"><Input id="baths" name="baths" type="number" min={0} required /></F>
            <F label="Year built" htmlFor="year"><Input id="year" name="year" type="number" min={1600} max={2030} /></F>
          </div>
          <F label="Description" htmlFor="desc"><Textarea id="desc" name="desc" rows={5} required placeholder="Describe the home, neighborhood and what makes it special." /></F>
        </Section>

        <Section title="Location">
          <div className="grid gap-4 sm:grid-cols-3">
            <F label="Country" htmlFor="country"><Input id="country" name="country" required /></F>
            <F label="City" htmlFor="city"><Input id="city" name="city" required /></F>
            <F label="Neighborhood" htmlFor="hood"><Input id="hood" name="hood" /></F>
          </div>
          <F label="Street address" htmlFor="address"><Input id="address" name="address" placeholder="Only shown to verified buyers" /></F>
        </Section>

        <Section title="Photos">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setPhotos((prev) => [...prev, ...files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))].slice(0, 12));
              e.target.value = "";
            }}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div key={p.url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border">
                <img src={p.url} alt={p.name} className="size-full object-cover" />
                <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-card/90 text-card-foreground" aria-label="Remove photo">
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <ImagePlus className="size-6" /> Add photos
            </button>
          </div>
        </Section>

        <Section title="Your contact details">
          <div className="grid gap-4 sm:grid-cols-3">
            <F label="Name" htmlFor="name"><Input id="name" name="name" required /></F>
            <F label="Email" htmlFor="email"><Input id="email" name="email" type="email" required /></F>
            <F label="Phone" htmlFor="phone"><Input id="phone" name="phone" type="tel" /></F>
          </div>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" size="lg">Submit listing</Button>
        </div>
      </form>
    </>
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
