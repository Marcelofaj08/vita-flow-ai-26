-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own subscriptions" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reminder preferences (per user)
CREATE TABLE public.reminder_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  meals_enabled BOOLEAN NOT NULL DEFAULT true,
  meal_times JSONB NOT NULL DEFAULT '{"breakfast":"08:00","lunch":"12:30","snack":"16:00","dinner":"19:30"}'::jsonb,
  workouts_enabled BOOLEAN NOT NULL DEFAULT true,
  workout_time TEXT NOT NULL DEFAULT '18:00',
  hydration_enabled BOOLEAN NOT NULL DEFAULT true,
  hydration_start TEXT NOT NULL DEFAULT '08:00',
  hydration_end TEXT NOT NULL DEFAULT '22:00',
  hydration_interval_minutes INTEGER NOT NULL DEFAULT 120,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own prefs" ON public.reminder_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.reminder_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.reminder_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own prefs" ON public.reminder_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_reminder_preferences_updated_at
  BEFORE UPDATE ON public.reminder_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Log to avoid duplicate sends
CREATE TABLE public.reminder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reminder_log_lookup ON public.reminder_log(user_id, reminder_key, sent_at);

ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reminder log" ON public.reminder_log
  FOR SELECT USING (auth.uid() = user_id);