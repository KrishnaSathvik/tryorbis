
-- Structured observability logging table
CREATE TABLE public.request_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  status text NOT NULL DEFAULT 'success', -- 'success', 'error', 'timeout'
  latency_ms integer NOT NULL DEFAULT 0,
  error_type text, -- 'api_error', 'parse_error', 'timeout', 'rate_limit', 'auth_error'
  error_message text,
  provider text, -- 'perplexity', 'gemini'
  tokens_used integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_request_logs_function_time ON public.request_logs (function_name, created_at DESC);
CREATE INDEX idx_request_logs_user_time ON public.request_logs (user_id, created_at DESC);
CREATE INDEX idx_request_logs_status ON public.request_logs (status, created_at DESC);

-- Enable RLS (service role only — no public access)
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup: delete logs older than 30 days via a scheduled function
CREATE OR REPLACE FUNCTION public.cleanup_old_request_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM request_logs WHERE created_at < now() - interval '30 days';
END;
$$;
