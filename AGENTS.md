<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Listings live in the `properties` table and are read through public server functions in `src/lib/properties.functions.ts` (publishable client, SSR-safe); only the agency directory stays static in `src/lib/properties.ts`. Prices are stored in USD and converted for display via `src/lib/currency.ts`, so currency switching never touches the data.
- Listing writes go from the browser Supabase client under the signed-in user's session; RLS enforces owner-only insert/update/delete, so no server function bypasses it.
- Listing photos sit in a private storage bucket (the workspace blocks public buckets); rows store storage paths for uploads and full URLs for seeded samples, and the read server function turns paths into signed URLs.
- The legacy `listings` / `listing_contacts` tables are deprecated and unused; never read or write them.
- Property filters live in URL search params on `/properties` (parsed by `parseFilters`) so searches are shareable; the home page keeps them in local state and hands them off on "View all".
- Mortgage math lives in `src/lib/mortgage.ts` (pure, unit-tested) so the calculator page stays presentational.
