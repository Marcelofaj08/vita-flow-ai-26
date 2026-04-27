
-- 1. Lock down reminder_log: explicitly deny client writes
DROP POLICY IF EXISTS "No client inserts on reminder_log" ON public.reminder_log;
DROP POLICY IF EXISTS "No client updates on reminder_log" ON public.reminder_log;
DROP POLICY IF EXISTS "No client deletes on reminder_log" ON public.reminder_log;

CREATE POLICY "No client inserts on reminder_log"
ON public.reminder_log
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No client updates on reminder_log"
ON public.reminder_log
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "No client deletes on reminder_log"
ON public.reminder_log
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- 2. Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
