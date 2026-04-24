-- 1) Enum + tabela de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2) Função segura has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 3) RLS user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Tabela de log de acessos
CREATE TABLE public.user_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL DEFAULT 'sign_in',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_access_log_user_id ON public.user_access_log(user_id);
CREATE INDEX idx_user_access_log_created_at ON public.user_access_log(created_at DESC);

ALTER TABLE public.user_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own access log"
  ON public.user_access_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own access log"
  ON public.user_access_log FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5) Função segura para o painel de admin
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  avatar_url text,
  signed_up_at timestamptz,
  last_sign_in_at timestamptz,
  routines_count bigint,
  age int,
  weight_kg numeric,
  height_cm numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    p.display_name,
    p.avatar_url,
    u.created_at AS signed_up_at,
    GREATEST(
      u.last_sign_in_at,
      (SELECT MAX(created_at) FROM public.user_access_log l WHERE l.user_id = u.id)
    ) AS last_sign_in_at,
    (SELECT COUNT(*) FROM public.routines r WHERE r.user_id = u.id) AS routines_count,
    h.age,
    h.weight_kg,
    h.height_cm
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.health_profiles h ON h.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 6) Atribuir admin ao criador
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('mmarcelofilho08@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;