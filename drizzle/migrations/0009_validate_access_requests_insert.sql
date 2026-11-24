DROP POLICY IF EXISTS "Anyone can request private access" ON public.access_requests;
CREATE POLICY "Anyone can request private access" ON public.access_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(full_name)) BETWEEN 1 AND 120
  AND char_length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR char_length(phone) <= 40)
  AND (market IS NULL OR market IN ('USA','Dubai','Abu Dhabi','Any'))
  AND (budget IS NULL OR char_length(budget) <= 120)
  AND (message IS NULL OR char_length(message) <= 2000)
  AND created_at >= now() - interval '5 minutes'
  AND created_at <= now() + interval '5 minutes'
);