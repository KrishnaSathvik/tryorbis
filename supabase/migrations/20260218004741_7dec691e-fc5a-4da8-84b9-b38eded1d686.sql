
-- rate_limits: only service role should access (used by edge functions with service role key)
CREATE POLICY "Deny all client access to rate_limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- request_logs: only service role should access
CREATE POLICY "Deny all client access to request_logs"
ON public.request_logs
FOR ALL
USING (false)
WITH CHECK (false);

-- feedback: tighten INSERT to require authenticated users (guests included)
DROP POLICY IF EXISTS "Users can submit feedback" ON public.feedback;
CREATE POLICY "Authenticated users can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
