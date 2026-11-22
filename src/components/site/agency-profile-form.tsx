import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canPublishForFree } from "@/lib/founding-access";

export function AgencyProfileForm() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("Dubai");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  return <section id="agency-profile" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
    <p className="eyebrow text-primary">Founding Partner Access – Free Listing</p>
    <h2 className="mt-2 text-3xl font-medium">Create your free agency profile</h2>
    <p className="mt-2 text-sm text-muted-foreground">No payment or subscription required.</p>
    {loading ? <p className="mt-6">Loading your account…</p> : !user ? <Button asChild className="mt-6"><Link to="/auth" search={{ redirect: "/agencies", mode: "signup" }}>Sign up or sign in</Link></Button> : <form className="mt-6 max-w-2xl space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      if (!canPublishForFree(Boolean(user))) return;
      const form = new FormData(event.currentTarget);
      setBusy(true); setSaved(false);
      const { error } = await supabase.from("agency_profiles").upsert({
        user_id: user.id, name: String(form.get("agency-name") ?? "").trim(), country,
        city: country === "United States" ? String(form.get("agency-city") ?? "").trim() : city,
        specialty: String(form.get("agency-specialty") ?? "").trim(),
      }, { onConflict: "user_id" });
      setBusy(false);
      if (error) { toast.error("Could not save your agency profile. Please try again."); return; }
      await queryClient.invalidateQueries({ queryKey: ["agency-profiles"] });
      setSaved(true);
    }}>
      <div className="space-y-1.5"><Label htmlFor="agency-name">Agency name</Label><Input id="agency-name" name="agency-name" required minLength={2} maxLength={120} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Country</Label><Select value={country} onValueChange={setCountry}><SelectTrigger className="w-full" aria-label="Agency country"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="United States">United States</SelectItem><SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem></SelectContent></Select></div>
        <div className="space-y-1.5"><Label htmlFor="agency-city">City</Label>{country === "United States" ? <Input id="agency-city" name="agency-city" required minLength={2} maxLength={80} /> : <Select value={city} onValueChange={setCity}><SelectTrigger className="w-full" aria-label="Agency city"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Dubai">Dubai</SelectItem><SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem></SelectContent></Select>}</div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="agency-specialty">Specialty</Label><Textarea id="agency-specialty" name="agency-specialty" required minLength={2} maxLength={300} /></div>
      <Button type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish free agency profile"}</Button>
      {saved && <p role="status" className="text-sm font-semibold text-primary">Your agency profile is live — published for free.</p>}
    </form>}
  </section>;
}