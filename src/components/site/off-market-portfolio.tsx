import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function OffMarketPortfolio() {
  const [market, setMarket] = useState("Any");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section aria-labelledby="off-market-title" className="overflow-hidden rounded-3xl bg-navy text-navy-foreground shadow-elevated">
      <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_440px]">
        <div className="flex flex-col justify-center">
          <p className="eyebrow text-highlight">Coming soon</p>
          <h2 id="off-market-title" className="mt-3 text-3xl font-medium leading-tight sm:text-5xl">Exclusive Off-Market Portfolio</h2>
          <p className="mt-5 max-w-lg text-navy-muted">
            We are curating a private collection of luxury residences across the USA, Dubai and Abu Dhabi.
            Many of our first homes will be shared privately before they are ever listed publicly.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Penthouses, villas and waterfront estates", "Early access before public release", "Direct introductions to verified agencies"].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><KeyRound className="size-4 text-highlight" />{t}</li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl border border-navy-border p-5">
            <p className="font-display text-xl">Are you an agency?</p>
            <p className="mt-1 text-sm text-navy-muted">Submit your properties for free with Founding Partner Access.</p>
            <Button asChild variant="hero" className="mt-4"><Link to="/post-listing">Submit your properties <ArrowRight /></Link></Button>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 text-card-foreground sm:p-8">
          {done ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto size-12 text-primary" />
              <p className="mt-4 font-display text-2xl">Request received</p>
              <p className="mt-2 text-sm text-muted-foreground">Thank you. Our team will be in touch privately as soon as matching homes are available.</p>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                const v = (k: string) => String(f.get(k) ?? "").trim();
                setSending(true);
                const { error } = await supabase.from("access_requests").insert({
                  full_name: v("name"), email: v("email"), phone: v("phone") || null,
                  market, budget: v("budget") || null, message: v("message") || null,
                });
                setSending(false);
                if (error) toast.error("Could not send your request", { description: "Please check your details and try again." });
                else setDone(true);
              }}
            >
              <div className="flex items-center gap-2"><Lock className="size-4 text-primary" /><p className="font-display text-xl">Request private access</p></div>
              <p className="text-sm text-muted-foreground">For investors and buyers seeking off-market opportunities.</p>
              <div className="space-y-1.5"><Label htmlFor="oa-name">Full name</Label><Input id="oa-name" name="name" required maxLength={100} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="oa-email">Email</Label><Input id="oa-email" name="email" type="email" required maxLength={255} /></div>
                <div className="space-y-1.5"><Label htmlFor="oa-phone">Phone</Label><Input id="oa-phone" name="phone" type="tel" maxLength={40} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Market</Label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger className="w-full" aria-label="Market of interest"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Any", "USA", "Dubai", "Abu Dhabi"].map((m) => <SelectItem key={m} value={m}>{m === "Any" ? "All markets" : m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="oa-budget">Budget</Label><Input id="oa-budget" name="budget" placeholder="e.g. $5M+" maxLength={60} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="oa-msg">What are you looking for?</Label><Textarea id="oa-msg" name="message" rows={3} maxLength={2000} /></div>
              <Button type="submit" size="lg" className="w-full" disabled={sending}>{sending ? "Sending…" : "Request private access"}</Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
