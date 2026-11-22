import { Link } from "@tanstack/react-router";
import { BadgeCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const plans = [
  { name: "Starter", price: "Free", period: "", blurb: "For independent agents getting started.", features: ["Up to 3 active listings", "Photo gallery & map on every listing", "Viewing requests from buyers"], cta: "Start free", featured: false },
  { name: "Pro Agency", price: "$79", period: "/month", blurb: "For growing brokerages.", features: ["Unlimited listings", "Verified agency badge", "Priority placement in search", "Everything in Starter"], cta: "Choose Pro", featured: true },
  { name: "Featured Partner", price: "$199", period: "/month", blurb: "Visibility across our three markets.", features: ["Homepage placement", "Unlimited listings", "Verified agency badge", "Everything in Pro Agency"], cta: "Become a partner", featured: false },
] as const;

export function AgencyPricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <p className="eyebrow text-primary">For brokerages</p>
      <h2 className="mt-2 text-3xl font-medium sm:text-4xl">Plans for real estate agencies</h2>
      <p className="mt-2 max-w-xl text-muted-foreground">List your portfolio in front of buyers across the USA, Dubai and Abu Dhabi. Start free and upgrade when you grow.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={"flex flex-col rounded-2xl border p-6 shadow-card " + (plan.featured ? "bg-navy text-navy-foreground" : "bg-card")}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-medium">{plan.name}</h3>
              {plan.featured && <span className="flex items-center gap-1 rounded-md bg-highlight px-2 py-0.5 text-xs font-semibold text-highlight-foreground"><BadgeCheck className="size-3.5" /> Most popular</span>}
            </div>
            <p className={"mt-1 text-sm " + (plan.featured ? "text-navy-muted" : "text-muted-foreground")}>{plan.blurb}</p>
            <p className="mt-6 font-display text-4xl font-semibold">{plan.price}<span className="ml-1 font-sans text-base font-medium opacity-70">{plan.period}</span></p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className={"mt-0.5 size-4 shrink-0 " + (plan.featured ? "text-highlight" : "text-primary")} />{f}</li>
              ))}
            </ul>
            <Button asChild size="lg" variant={plan.featured ? "hero" : "outline"} className="mt-8 w-full">
              <Link to="/post-listing">{plan.cta}</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
