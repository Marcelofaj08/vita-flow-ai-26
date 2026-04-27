-- 1. Defense in depth: explicitly deny anon access to user_roles
CREATE POLICY "Deny anon access to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Harden has_role to prevent privilege escalation reconnaissance.
-- Only allow checking own roles, unless caller is an admin themselves.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        -- caller is checking themselves
        _user_id = auth.uid()
        -- or caller is an admin (direct lookup, avoids recursion)
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'::app_role
        )
      )
  );
$function$;