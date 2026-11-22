import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgencyPricing() {
  return (
    <section id="founding-access" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="eyebrow text-primary">For brokerages</p>
      <h2 className="mt-2 text-3xl font-medium sm:text-4xl">Founding partner access</h2>
      <p className="mt-2 max-w-xl text-muted-foreground">Property listings and agency profiles are 100% free for now. No payment or subscription required.</p>
      <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
        {["Unlimited free listings", "Free agency profile", "Photo galleries, maps & viewing inquiries"].map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="size-4 shrink-0 text-primary" />{feature}</li>)}
      </ul>
      <Button asChild className="mt-6"><Link to="/post-listing">Post a free listing</Link></Button>
    </section>
  );
}
