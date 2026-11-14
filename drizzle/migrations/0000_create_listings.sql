CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  kind text NOT NULL CHECK (kind IN ('Apartment','House','Villa')),
  listing_type text NOT NULL CHECK (listing_type IN ('buy','rent')),
  country text NOT NULL CHECK (char_length(country) BETWEEN 2 AND 60),
  city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 80),
  neighborhood text CHECK (neighborhood IS NULL OR char_length(neighborhood) <= 80),
  price_usd numeric NOT NULL CHECK (price_usd > 0 AND price_usd < 10000000000),
  size_m2 integer NOT NULL CHECK (size_m2 > 0 AND size_m2 < 100000),
  beds integer NOT NULL CHECK (beds BETWEEN 0 AND 100),
  baths integer NOT NULL CHECK (baths BETWEEN 0 AND 100),
  year_built integer CHECK (year_built IS NULL OR year_built BETWEEN 1500 AND 2100),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  image_paths text[] NOT NULL CHECK (cardinality(image_paths) BETWEEN 1 AND 12),
  seller_name text NOT NULL CHECK (char_length(seller_name) BETWEEN 1 AND 80),
  lat double precision CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng double precision CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.listings TO anon, authenticated;
GRANT ALL ON public.listings TO service_role;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are publicly readable" ON public.listings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can submit a listing" ON public.listings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX listings_created_at_idx ON public.listings (created_at DESC);

CREATE TABLE public.listing_contacts (
  listing_id uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254 AND email LIKE '%@%'),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  address text CHECK (address IS NULL OR char_length(address) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.listing_contacts TO anon, authenticated;
GRANT ALL ON public.listing_contacts TO service_role;

ALTER TABLE public.listing_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can attach contact details to a listing" ON public.listing_contacts
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Listing photos are publicly readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-photos');

CREATE POLICY "Anyone can upload listing photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','avif','gif')
  );