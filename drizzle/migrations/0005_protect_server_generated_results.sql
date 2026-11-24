REVOKE INSERT, UPDATE ON public.url_scans, public.email_scans, public.security_scores, public.learning_progress, public.messages FROM authenticated, anon;
GRANT SELECT, DELETE ON public.url_scans, public.email_scans, public.security_scores, public.learning_progress, public.messages TO authenticated;
GRANT ALL ON public.url_scans, public.email_scans, public.security_scores, public.learning_progress, public.messages TO service_role;
COMMENT ON TABLE public.url_scans IS 'Server-generated results: authenticated clients may only read/delete their own records; verified server handlers create results.';
COMMENT ON TABLE public.email_scans IS 'Server-generated phishing results: authenticated clients may only read/delete their own records.';
COMMENT ON TABLE public.security_scores IS 'Server-calculated assessments: client insertion and updates are forbidden.';
COMMENT ON TABLE public.learning_progress IS 'Server-graded learning progress: client insertion and updates are forbidden.';
COMMENT ON TABLE public.messages IS 'Messages are written by authenticated server handlers only; client assistant-role injection is forbidden.';