ALTER TABLE public.properties DROP CONSTRAINT properties_kind_check;
ALTER TABLE public.properties ADD CONSTRAINT properties_kind_check CHECK (kind IN ('Apartment', 'House', 'Villa', 'Penthouse', 'Townhouse'));
CREATE TABLE public.listing_status (
 property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
 featured boolean NOT NULL DEFAULT false,
 verified_agent boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.listing_status TO anon, authenticated;
GRANT ALL ON public.listing_status TO service_role;
ALTER TABLE public.listing_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read listing status" ON public.listing_status FOR SELECT TO anon, authenticated USING (true);
COMMENT ON TABLE public.listing_status IS 'Platform-managed promotional placement and verified-agent status. Listing owners cannot self-verify or self-promote.';