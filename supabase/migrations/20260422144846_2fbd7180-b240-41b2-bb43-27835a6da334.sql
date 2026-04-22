ALTER TABLE public.health_profiles
ADD COLUMN active_routine_id UUID;

CREATE INDEX idx_health_profiles_active_routine ON public.health_profiles(active_routine_id);