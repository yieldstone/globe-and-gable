import { Link } from "@tanstack/react-router";
import { Logo } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-navy-deep text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-navy-muted">
            Homes, villas and apartments for sale and rent in 10+ countries — with trusted local
            agencies in every market.
          </p>
        </div>
        <div>
          <p className="eyebrow text-navy-muted">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/properties" search={{ type: "buy" }} className="hover:text-highlight">Buy</Link></li>
            <li><Link to="/properties" search={{ type: "rent" }} className="hover:text-highlight">Rent</Link></li>
            <li><Link to="/agencies" className="hover:text-highlight">Agencies</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-navy-muted">Tools</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/mortgage-calculator" className="hover:text-highlight">Mortgage calculator</Link></li>
            <li><Link to="/post-listing" className="hover:text-highlight">Post a listing</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-border">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-navy-muted sm:px-6">
          © {new Date().getFullYear()} Atlas Estates. Prices shown in EUR use a fixed reference rate.
        </p>
      </div>
    </footer>
  );
}
