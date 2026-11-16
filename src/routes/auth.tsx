import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const safePath = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : undefined);

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined; mode?: "login" | "signup" | undefined } => ({
    redirect: safePath(search["redirect"]),
    mode: search["mode"] === "signup" ? "signup" : search["mode"] === "login" ? "login" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account | Atlas Estates" },
      { name: "description", content: "Log in or sign up to post and manage your property listings on Atlas Estates." },
      { property: "og:title", content: "Sign in | Atlas Estates" },
      { property: "og:description", content: "Log in or create a free account to post listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect, mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(mode ?? "login");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: redirect ?? "/", replace: true });
  }, [loading, user, redirect, navigate]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) return toast.error(error.message === "Invalid login credentials" ? "Wrong email or password" : error.message);
    toast.success("Welcome back");
  }

  async function onSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) return toast.error("Passwords don't match");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${redirect ?? "/"}` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) setCheckEmail(email);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-center text-4xl font-medium">Your Atlas account</h1>
      <p className="mt-2 text-center text-muted-foreground">Sign in to post and manage your listings.</p>

      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-card">
        {checkEmail ? (
          <div className="py-6 text-center">
            <p className="font-display text-2xl">Check your inbox</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-semibold text-foreground">{checkEmail}</span>. Click it to activate your account.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => { setCheckEmail(null); setTab("login"); }}>Back to login</Button>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form className="mt-4 space-y-4" onSubmit={onLogin}>
                <div className="space-y-1.5"><Label htmlFor="li-email">Email</Label><Input id="li-email" name="email" type="email" autoComplete="email" required /></div>
                <div className="space-y-1.5"><Label htmlFor="li-pass">Password</Label><Input id="li-pass" name="password" type="password" autoComplete="current-password" required /></div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Log in"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form className="mt-4 space-y-4" onSubmit={onSignup}>
                <div className="space-y-1.5"><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" autoComplete="email" required /></div>
                <div className="space-y-1.5"><Label htmlFor="su-pass">Password</Label><Input id="su-pass" name="password" type="password" autoComplete="new-password" minLength={6} required /></div>
                <div className="space-y-1.5"><Label htmlFor="su-confirm">Confirm password</Label><Input id="su-confirm" name="confirm" type="password" autoComplete="new-password" minLength={6} required /></div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Link to="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
    </div>
  );
}
