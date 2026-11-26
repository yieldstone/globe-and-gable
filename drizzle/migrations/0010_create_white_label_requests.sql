CREATE TABLE public.white_label_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  agency_name text NOT NULL,
  market text NOT NULL,
  contact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT white_label_requests_name_length CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 100),
  CONSTRAINT white_label_requests_agency_length CHECK (char_length(btrim(agency_name)) BETWEEN 2 AND 120),
  CONSTRAINT white_label_requests_market_valid CHECK (market IN ('USA', 'Dubai', 'Abu Dhabi')),
  CONSTRAINT white_label_requests_contact_length CHECK (char_length(btrim(contact)) BETWEEN 5 AND 255)
);

GRANT INSERT ON public.white_label_requests TO anon, authenticated;
GRANT ALL ON public.white_label_requests TO service_role;

ALTER TABLE public.white_label_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit validated white-label requests"
ON public.white_label_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(btrim(full_name)) BETWEEN 2 AND 100
  AND char_length(btrim(agency_name)) BETWEEN 2 AND 120
  AND market IN ('USA', 'Dubai', 'Abu Dhabi')
  AND char_length(btrim(contact)) BETWEEN 5 AND 255
);