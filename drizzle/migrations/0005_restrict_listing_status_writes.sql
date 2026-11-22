REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.listing_status FROM anon, authenticated;
GRANT SELECT ON public.listing_status TO anon, authenticated;