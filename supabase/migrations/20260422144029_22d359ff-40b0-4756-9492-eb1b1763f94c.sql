CREATE TABLE public.health_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  age INTEGER,
  bioimpedance_notes TEXT,
  bioimpedance_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health profile"
ON public.health_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health profile"
ON public.health_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health profile"
ON public.health_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.assistant_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assistant messages"
ON public.assistant_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assistant messages"
ON public.assistant_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assistant messages"
ON public.assistant_messages
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_assistant_messages_user_created ON public.assistant_messages(user_id, created_at);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_health_profiles_updated_at
BEFORE UPDATE ON public.health_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('bioimpedance', 'bioimpedance', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view own bioimpedance files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own bioimpedance files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own bioimpedance files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own bioimpedance files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'bioimpedance' AND auth.uid()::text = (storage.foldername(name))[1]);