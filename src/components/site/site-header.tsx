import { Check, Globe, LogOut, Menu, UserRound } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrency } from "./currency-context";
import type { Currency } from "@/lib/currency";

const nav = [
  { to: "/properties", label: "Properties" },
  { to: "/mortgage-calculator", label: "Mortgage Calculator" },
  { to: "/post-listing", label: "Post a Listing" },
  { to: "/agencies", label: "Agencies" },
] as const;

const languages = [
  { code: "EN", label: "English", available: true },
  { code: "ES", label: "Español", available: false },
  { code: "DE", label: "Deutsch", available: false },
  { code: "FR", label: "Français", available: false },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-highlight font-display text-lg font-semibold text-highlight-foreground">
        A
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">
        Atlas<span className="text-highlight">Estates</span>
      </span>
    </Link>
  );
}

function LocaleSwitcher() {
  const { currency, setCurrency } = useCurrency();
  const currencies: { code: Currency; label: string }[] = [
    { code: "USD", label: "US Dollar ($)" },
    { code: "EUR", label: "Euro (€)" },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="on-navy" size="sm" aria-label="Language and currency">
          <Globe /> EN · {currency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="eyebrow text-muted-foreground">Language</DropdownMenuLabel>
        {languages.map((l) => (
          <DropdownMenuItem key={l.code} disabled={!l.available} className="justify-between">
            {l.label}
            {l.available ? <Check className="size-4" /> : <span className="text-xs">Soon</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="eyebrow text-muted-foreground">Currency</DropdownMenuLabel>
        {currencies.map((c) => (
          <DropdownMenuItem key={c.code} onSelect={() => setCurrency(c.code)} className="justify-between">
            {c.label}
            {currency === c.code && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMenu() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  if (loading) return <span className="w-20" />;
  if (!user) {
    return (
      <Button asChild variant="on-navy" size="sm">
        <Link to="/auth" search={{ redirect: undefined, mode: undefined }}>Sign in</Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="on-navy" size="icon" aria-label="Account">
          <UserRound />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await queryClient.cancelQueries();
            await signOut();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-navy-border bg-navy/95 text-navy-foreground backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-navy-muted transition-colors hover:text-navy-foreground"
              activeProps={{ className: "text-navy-foreground bg-navy-foreground/10" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <AccountMenu />
          <Button asChild variant="hero" size="sm" className="hidden sm:inline-flex">
            <Link to="/post-listing">List property</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="on-navy" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-4">
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 font-medium hover:bg-accent"
                    activeProps={{ className: "bg-accent text-primary" }}
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
