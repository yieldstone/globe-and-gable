-- Replace the anonymous listings tables with user-owned properties.
DROP POLICY IF EXISTS "Listing photos are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can submit a listing" ON public.listings;
DROP POLICY IF EXISTS "Anyone can attach contact details to a listing" ON public.listing_contacts;
COMMENT ON TABLE public.listings IS 'DEPRECATED: replaced by public.properties';
COMMENT ON TABLE public.listing_contacts IS 'DEPRECATED: replaced by public.properties';

-- Profiles: one row per account, filled automatically on sign-up.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.created_at, now()))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Properties: public listings; signed-in users create and manage their own.
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
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
  images text[] NOT NULL CHECK (cardinality(images) BETWEEN 1 AND 12),
  features text[] NOT NULL DEFAULT '{}' CHECK (cardinality(features) <= 30),
  seller_name text NOT NULL CHECK (char_length(seller_name) BETWEEN 1 AND 80),
  seller_phone text CHECK (seller_phone IS NULL OR char_length(seller_phone) <= 40),
  agency_id text,
  lat double precision CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng double precision CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are publicly readable" ON public.properties
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can add their own properties" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND agency_id IS NULL);

CREATE POLICY "Users can update their own properties" ON public.properties
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND agency_id IS NULL);

CREATE POLICY "Users can delete their own properties" ON public.properties
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX properties_created_at_idx ON public.properties (created_at DESC);
CREATE INDEX properties_user_id_idx ON public.properties (user_id);

-- Photo storage: anyone can view, signed-in users upload into their own folder.
CREATE POLICY "Listing photos are publicly readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-photos');

CREATE POLICY "Users upload listing photos to their own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','avif','gif')
  );

CREATE POLICY "Users delete their own listing photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Sample listings (no owner; managed by partner agencies).
INSERT INTO public.properties (title, kind, listing_type, country, city, neighborhood, price_usd, size_m2, beds, baths, year_built, description, images, features, seller_name, seller_phone, agency_id, lat, lng, created_at) VALUES
('Tribeca Skyline Penthouse', 'Apartment', 'buy', 'United States', 'New York', 'Tribeca', 4250000, 210, 3, 3, 2019, 'A full-floor penthouse with floor-to-ceiling windows framing the Hudson River and the downtown skyline. Wide-plank oak floors, a chef''s kitchen with integrated appliances, and a private terrace make this a rare find in one of Manhattan''s most sought-after neighborhoods.', ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Private terrace','24/7 doorman','Fitness center','Floor-to-ceiling windows','Central A/C','Storage unit']::text[], 'Rachel Kim', '+1 212 555 0161', 'skyline-realty', 40.7163, -74.0086, now() - interval '0 hours'),
('Golden Mile Contemporary Villa', 'Villa', 'buy', 'Spain', 'Marbella', 'Golden Mile', 3850000, 520, 5, 5, 2021, 'Clean architectural lines, an infinity pool and sweeping views to the Mediterranean. This newly built villa sits minutes from Puerto Banús with open-plan living spaces that flow onto sun-drenched terraces.', ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Infinity pool','Sea views','Home cinema','Underfloor heating','Smart home','Double garage']::text[], 'Javier Morales', '+34 952 555 233', 'costa-luxe', 36.5101, -4.8825, now() - interval '1 hours'),
('Le Marais Haussmann Apartment', 'Apartment', 'rent', 'France', 'Paris', 'Le Marais', 6800, 95, 2, 1, 1885, 'A light-filled, fully furnished apartment on the third floor of a classic Haussmann building. Herringbone parquet, ornate mouldings and tall French windows overlooking a quiet cobbled street in the heart of the Marais.', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Fully furnished','Elevator','Herringbone parquet','Balcony','Washer & dryer','Fiber internet']::text[], 'Camille Laurent', '+33 1 55 50 12 40', 'maison-co', 48.859, 2.3622, now() - interval '2 hours'),
('Mosman Harbour Family Home', 'House', 'buy', 'Australia', 'Sydney', 'Mosman', 3950000, 340, 4, 3, 2015, 'A relaxed coastal home on a leafy street, a short walk to Balmoral Beach. Generous indoor-outdoor living wraps around a saltwater pool and landscaped gardens — ideal for family life by the harbour.', ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Saltwater pool','Landscaped garden','Walk to beach','Solar panels','Two-car garage','Outdoor kitchen']::text[], 'Liam O''Connor', '+61 2 5550 1311', 'harbour-estates', -33.829, 151.244, now() - interval '3 hours'),
('Canggu Tropical Pool Villa', 'Villa', 'rent', 'Indonesia', 'Bali', 'Canggu', 4500, 280, 3, 3, 2020, 'A serene open-air villa surrounded by palms, five minutes from Echo Beach. Private pool, tropical garden and weekly housekeeping included — perfect for long stays and remote work.', ARRAY['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Private pool','Housekeeping included','Tropical garden','Workspace','Near the beach','Starlink internet']::text[], 'Putu Ayu Dewi', '+62 361 555 0198', 'harbour-estates', -8.6478, 115.1385, now() - interval '4 hours'),
('Kensington Garden Square Flat', 'Apartment', 'buy', 'United Kingdom', 'London', 'Kensington', 2150000, 120, 2, 2, 1890, 'An elegant raised-ground-floor flat in a white stucco Victorian terrace, with access to a private communal garden square. Refurbished throughout while keeping original sash windows and fireplaces.', ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Communal garden','Original fireplaces','Porter','Share of freehold','Near Underground','Wine cellar']::text[], 'Oliver Bennett', '+44 20 5550 7790', 'kensington-rowe', 51.499, -0.1938, now() - interval '5 hours'),
('Oakville Lakeside Residence', 'House', 'buy', 'Canada', 'Toronto', 'Oakville', 1480000, 260, 4, 3, 2012, 'A classic brick family home on a quiet crescent near Lake Ontario. Finished basement, a bright eat-in kitchen and top-rated schools nearby. Just 30 minutes from downtown Toronto.', ARRAY['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Finished basement','Two-car garage','Top-rated schools','Fireplace','Large backyard','Near GO Train']::text[], 'Emily Tremblay', '+1 416 555 0127', 'kensington-rowe', 43.4675, -79.6877, now() - interval '6 hours'),
('Palm Jumeirah Signature Villa', 'Villa', 'buy', 'United Arab Emirates', 'Dubai', 'Palm Jumeirah', 7900000, 650, 6, 7, 2022, 'A frond-front villa with private beach access and unobstructed views of the Dubai Marina skyline. Double-height living spaces, a temperature-controlled pool and staff quarters complete this exceptional residence.', ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Private beach','Temperature-controlled pool','Skyline views','Staff quarters','Elevator','Rooftop lounge']::text[], 'Omar Al Mansoori', '+971 4 555 0201', 'gulf-prime', 25.1124, 55.139, now() - interval '7 hours'),
('Cascais Ocean View House', 'House', 'buy', 'Portugal', 'Lisbon', 'Cascais', 1950000, 310, 4, 4, 2018, 'A modern family house on the hills above Cascais with Atlantic views from every level. Private pool, mature garden and a short drive to Lisbon city center and the beaches of the Estoril coast.', ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Ocean views','Private pool','Garden','Solar heating','Home office','Gated community']::text[], 'Inês Carvalho', '+351 21 555 0174', 'costa-luxe', 38.6979, -9.4215, now() - interval '8 hours'),
('Matterhorn View Chalet', 'House', 'rent', 'Switzerland', 'Zermatt', 'Winkelmatten', 12500, 220, 4, 3, 2010, 'A warm timber chalet with direct views of the Matterhorn, a short walk from the ski lifts. Wood-burning fireplace, sauna and a sunny terrace for après-ski evenings. Available for seasonal or annual lease.', ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['Matterhorn views','Sauna','Ski-in access','Fireplace','Boot room','Fully furnished']::text[], 'Lukas Brunner', '+41 27 555 04 52', 'alpine-coast', 46.0207, 7.7491, now() - interval '9 hours'),
('Prenzlauer Berg Altbau Loft', 'Apartment', 'rent', 'Germany', 'Berlin', 'Prenzlauer Berg', 2900, 85, 2, 1, 1905, 'A characterful Altbau apartment with 3.5 m ceilings, restored floorboards and a balcony over a tree-lined street. Close to Kollwitzplatz cafés, the weekend market and excellent transport links.', ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['High ceilings','Balcony','Fitted kitchen','Bike storage','Near U-Bahn','Pets allowed']::text[], 'Jonas Weber', '+49 30 5550 1287', 'maison-co', 52.539, 13.424, now() - interval '10 hours'),
('Hollywood Hills Modern Retreat', 'House', 'rent', 'United States', 'Los Angeles', 'Hollywood Hills', 14000, 380, 4, 5, 2017, 'A private, gated hillside home with canyon and city-light views. Disappearing glass walls open the living area to a pool deck, while the primary suite offers a spa bath and walk-in closet.', ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80']::text[], ARRAY['City-light views','Pool & spa','Gated driveway','Walk-in closets','EV charger','Home gym']::text[], 'Marcus Reed', '+1 310 555 0119', 'skyline-realty', 34.118, -118.34, now() - interval '11 hours');