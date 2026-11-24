CREATE TABLE public.workspace_profiles (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  notification_prefs jsonb NOT NULL DEFAULT '{"threat_alerts":true,"privacy_reminder":true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_profiles TO authenticated;
GRANT ALL ON public.workspace_profiles TO service_role;
ALTER TABLE public.workspace_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workspace profile" ON public.workspace_profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER workspace_profile_updated_at BEFORE UPDATE ON public.workspace_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON TABLE public.workspace_profiles IS 'App profile fields for verified Lovable workspace identities; separate from legacy visitor accounts without rebinding their records.';