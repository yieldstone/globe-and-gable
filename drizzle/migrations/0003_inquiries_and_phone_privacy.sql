CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  preferred_date date,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.inquiries TO service_role;
GRANT SELECT ON public.inquiries TO authenticated;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listing owners read inquiries on their properties" ON public.inquiries FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.user_id = auth.uid()));

REVOKE SELECT ON public.properties FROM anon, authenticated;
GRANT SELECT (id, user_id, title, kind, listing_type, country, city, neighborhood, price_usd, size_m2, beds, baths, year_built, description, images, features, seller_name, agency_id, lat, lng, created_at) ON public.properties TO anon, authenticated;

DROP POLICY IF EXISTS "Listings are publicly readable" ON public.listings;
REVOKE ALL ON public.listings FROM anon, authenticated;
REVOKE ALL ON public.listing_contacts FROM anon, authenticated;
COMMENT ON TABLE public.listings IS 'DEPRECATED: replaced by public.properties; locked, unused';
COMMENT ON TABLE public.listing_contacts IS 'DEPRECATED: replaced by public.properties; locked, unused';