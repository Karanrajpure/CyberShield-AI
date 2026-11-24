DROP POLICY IF EXISTS "own rows" ON public.messages;
CREATE POLICY "own messages read" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own messages delete" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own rows" ON public.learning_progress;
CREATE POLICY "own learning read" ON public.learning_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own learning delete" ON public.learning_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own rows" ON public.security_scores;
CREATE POLICY "own scores read" ON public.security_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own scores delete" ON public.security_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE ON public.messages, public.learning_progress, public.security_scores FROM authenticated, anon;
GRANT SELECT, DELETE ON public.messages, public.learning_progress, public.security_scores TO authenticated;
GRANT ALL ON public.messages, public.learning_progress, public.security_scores TO service_role;

DROP POLICY IF EXISTS "signed-in read" ON public.threat_alerts;
CREATE POLICY "signed-in public CISA advisories" ON public.threat_alerts FOR SELECT TO authenticated USING (
  source_name = 'CISA Known Exploited Vulnerabilities'
  AND category = 'Vulnerability'
  AND source_url ~ '^https://nvd[.]nist[.]gov/vuln/detail/CVE-[0-9]{4}-[0-9]{4,}$'
);
COMMENT ON TABLE public.threat_alerts IS 'Shared public CISA vulnerability advisories only; signed-in reads are limited to canonical public references. No private user data belongs here.';