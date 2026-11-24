CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  market text CHECK (market IS NULL OR market IN ('USA','Dubai','Abu Dhabi','Any')),
  budget text CHECK (budget IS NULL OR char_length(budget) <= 60),
  message text CHECK (message IS NULL OR char_length(message) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.access_requests TO anon, authenticated;
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request private access" ON public.access_requests FOR INSERT TO anon, authenticated WITH CHECK (true);