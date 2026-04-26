INSERT INTO public.user_roles (user_id, role)
VALUES ('5d9aad41-a0e8-4692-bb80-a8dd79bf495e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;