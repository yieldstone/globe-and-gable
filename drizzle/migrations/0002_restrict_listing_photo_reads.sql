DROP POLICY IF EXISTS "Listing photos are publicly readable" ON storage.objects;
CREATE POLICY "Users read their own listing photos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);