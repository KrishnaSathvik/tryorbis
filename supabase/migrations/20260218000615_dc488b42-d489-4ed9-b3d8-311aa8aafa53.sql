
-- Rate limiting table
CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_user_function_time 
ON public.rate_limits (user_id, function_name, created_at DESC);

-- Enable RLS (service role only access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role can read/write

-- Atomic rate limit check function: returns true if ALLOWED, false if rate limited
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_function_name text,
  p_max_requests integer DEFAULT 10,
  p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Count recent requests within window
  SELECT count(*) INTO recent_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND function_name = p_function_name
    AND created_at > now() - (p_window_seconds || ' seconds')::interval;

  -- If over limit, deny
  IF recent_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- Record this request
  INSERT INTO rate_limits (user_id, function_name) 
  VALUES (p_user_id, p_function_name);

  -- Cleanup old entries (older than 5 minutes) to prevent table bloat
  DELETE FROM rate_limits 
  WHERE created_at < now() - interval '5 minutes';

  RETURN true;
END;
$$;
