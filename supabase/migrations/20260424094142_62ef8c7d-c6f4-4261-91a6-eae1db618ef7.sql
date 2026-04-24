-- 1. Fix privilege escalation on user_roles: restrict INSERT/UPDATE/DELETE to admins only
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Add DELETE policy for health_profiles so users can delete their own sensitive data
CREATE POLICY "Users can delete own health profile"
ON public.health_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Tighten bioimpedance storage policies to authenticated only
DROP POLICY IF EXISTS "Users can view own bioimpedance" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own bioimpedance" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own bioimpedance" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own bioimpedance" ON storage.objects;

CREATE POLICY "Users can view own bioimpedance"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own bioimpedance"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own bioimpedance"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own bioimpedance"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);