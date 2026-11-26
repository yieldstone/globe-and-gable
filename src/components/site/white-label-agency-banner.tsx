import { useState, type FormEvent } from "react";
import { Check, CheckCircle2, FileDown, Globe2, ListChecks, MessageCircle, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const features = [
  { icon: Globe2, title: "Custom Domain", text: "Serve the calculator from your agency's own web address." },
  { icon: Palette, title: "Agency Logo & Colors", text: "Match the experience to your brokerage identity." },
  { icon: FileDown, title: "Branded PDF Exports", text: "Give every investment report your agency branding." },
  { icon: ListChecks, title: "Custom Lead Form", text: "Capture the client details your team needs." },
];

// Placeholder requested for the CTA; replace with the agency's public WhatsApp number at launch.
const whatsappHref = `https://wa.me/1234567890?text=${encodeURIComponent("Hello Yieldstone, I'd like to learn more about the white-label ROI Calculator.")}`;

export function WhiteLabelAgencyBanner() {
  const [open, setOpen] = useState(false);
  const [market, setMarket] = useState("Dubai");
  const [sending, setSending] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSubmittedName(null);
      setError(null);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const fullName = value("fullName");
    setSending(true);
    setError(null);
    const { error: insertError } = await supabase.from("white_label_requests").insert({
      full_name: fullName,
      agency_name: value("agencyName"),
      market,
      contact: value("contact"),
    });
    setSending(false);
    if (insertError) {
      setError("We could not save your request. Please check your details and try again.");
      return;
    }
    setSubmittedName(fullName);
  };

  return (
    <section className="mt-6 flex flex-col items-start justify-between gap-6 rounded-3xl bg-navy p-8 text-navy-foreground shadow-elevated sm:p-10 lg:flex-row lg:items-center" aria-labelledby="white-label-title">
      <div>
        <p className="eyebrow text-highlight">For agencies & brokers</p>
        <h2 id="white-label-title" className="mt-3 text-3xl font-medium">Put Yieldstone ROI under your brand</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-muted">Offer clients a polished investment calculator with your domain, visual identity, branded reports and lead capture.</p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button variant="hero" size="lg">Request White-Label Demo</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-6 sm:p-8">
            {submittedName ? (
              <div className="py-8 text-center" role="status">
                <CheckCircle2 className="mx-auto size-12 text-primary" />
                <DialogTitle className="mt-4 font-display text-3xl">Request received</DialogTitle>
                <DialogDescription className="mx-auto mt-3 max-w-md leading-relaxed">
                  Thank you, {submittedName}. Your white-label demo request has been saved and our team will contact you using the details provided.
                </DialogDescription>
                <Button className="mt-6" onClick={() => setOpen(false)}>Done</Button>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <p className="eyebrow text-primary">Yieldstone for agencies</p>
                  <DialogTitle className="font-display text-3xl font-medium">Request a White-Label Demo</DialogTitle>
                  <DialogDescription>Tell us about your agency and see the calculator tailored to your brand.</DialogDescription>
                </DialogHeader>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {features.map((feature) => (
                    <div key={feature.title} className="rounded-xl border bg-card p-4">
                      <feature.icon className="size-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold">{feature.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.text}</p>
                    </div>
                  ))}
                </div>
                <form className="mt-2 space-y-4 border-t pt-6" onSubmit={submit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="wl-full-name">Full Name</Label>
                      <Input id="wl-full-name" name="fullName" autoComplete="name" required minLength={2} maxLength={100} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wl-agency-name">Agency Name</Label>
                      <Input id="wl-agency-name" name="agencyName" autoComplete="organization" required minLength={2} maxLength={120} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Market</Label>
                      <Select value={market} onValueChange={setMarket}>
                        <SelectTrigger className="w-full" aria-label="White-label market"><SelectValue /></SelectTrigger>
                        <SelectContent>{["USA", "Dubai", "Abu Dhabi"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wl-contact">WhatsApp / Email</Label>
                      <Input id="wl-contact" name="contact" placeholder="+971 … or name@agency.com" required minLength={5} maxLength={255} />
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                  <Button type="submit" size="lg" className="w-full" disabled={sending}>{sending ? "Submitting…" : "Submit Demo Request"}</Button>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Check className="size-3.5" />Your contact details are stored privately.</p>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
        <Button asChild variant="whatsapp" size="lg">
          <a href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle />Chat on WhatsApp</a>
        </Button>
      </div>
    </section>
  );
}
