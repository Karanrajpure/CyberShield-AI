CREATE TABLE public.url_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  submitted_url TEXT NOT NULL CHECK (char_length(submitted_url) BETWEEN 1 AND 2048),
  domain TEXT NOT NULL CHECK (char_length(domain) <= 253),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','suspicious','high','unknown')),
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  scan_status TEXT NOT NULL DEFAULT 'completed' CHECK (scan_status IN ('completed','partial','failed')),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX url_scans_user_time ON public.url_scans (user_id, scanned_at DESC);

CREATE TABLE public.email_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('email','sms','whatsapp','social','other')),
  submitted_content TEXT NOT NULL CHECK (char_length(submitted_content) BETWEEN 1 AND 20000),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','suspicious','high','unknown')),
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX email_scans_user_time ON public.email_scans (user_id, created_at DESC);

CREATE TABLE public.security_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  assessment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX security_scores_user_time ON public.security_scores (user_id, created_at DESC);

CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (char_length(description) <= 2000),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, title)
);
CREATE INDEX recommendations_user ON public.recommendations (user_id, completed);

CREATE TABLE public.threat_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical','unknown')),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  published_at TIMESTAMPTZ
);
CREATE INDEX threat_alerts_pub ON public.threat_alerts (published_at DESC);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL DEFAULT 'New conversation' CHECK (char_length(title) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX conversations_user ON public.conversations (user_id, created_at DESC);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL CHECK (char_length(content) <= 50000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv ON public.messages (conversation_id, created_at);

CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  module_id TEXT NOT NULL CHECK (char_length(module_id) <= 100),
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  quiz_score INTEGER CHECK (quiz_score BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, module_id)
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  report_name TEXT NOT NULL CHECK (char_length(report_name) <= 200),
  storage_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reports_user ON public.reports (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.url_scans, public.email_scans, public.security_scores, public.recommendations, public.conversations, public.messages, public.learning_progress, public.reports TO authenticated;
GRANT SELECT ON public.threat_alerts TO authenticated;
GRANT ALL ON public.url_scans, public.email_scans, public.security_scores, public.recommendations, public.threat_alerts, public.conversations, public.messages, public.learning_progress, public.reports TO service_role;

ALTER TABLE public.url_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON public.url_scans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows" ON public.email_scans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows" ON public.security_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows" ON public.recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows" ON public.conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows" ON public.messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "own rows" ON public.learning_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rows" ON public.reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "signed-in read" ON public.threat_alerts FOR SELECT TO authenticated USING (true);