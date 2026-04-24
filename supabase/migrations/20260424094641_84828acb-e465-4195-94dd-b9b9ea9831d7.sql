-- 1. Drop legacy {public}-role bioimpedance policies (duplicates of the authenticated ones)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND 'public' = ANY(roles)
      AND qual LIKE '%bioimpedance%' OR with_check LIKE '%bioimpedance%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Recreate clean authenticated-only policies (idempotent)
DROP POLICY IF EXISTS "Users can view own bioimpedance" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own bioimpedance" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own bioimpedance" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own bioimpedance" ON storage.objects;

CREATE POLICY "Users can view own bioimpedance"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own bioimpedance"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own bioimpedance"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own bioimpedance"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Restrict user_roles policies to authenticated role only
DROP POLICY IF EXISTS "Admins manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role));