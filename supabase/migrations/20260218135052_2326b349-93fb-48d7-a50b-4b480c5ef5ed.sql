
-- Add new columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_credits integer NOT NULL DEFAULT 20;

-- Set max_credits for existing users based on their current anonymous status
-- (existing guests who haven't upgraded will have max_credits = 5)

-- Update handle_new_user to set max_credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _credits integer;
  _max_credits integer;
  _display_name text;
BEGIN
  IF NEW.is_anonymous = true THEN
    _credits := 5;
    _max_credits := 5;
  ELSE
    _credits := 20;
    _max_credits := 20;
  END IF;
  
  _display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous');
  
  INSERT INTO public.profiles (user_id, display_name, email, credits, max_credits)
  VALUES (NEW.id, _display_name, NEW.email, _credits, _max_credits);
  
  RETURN NEW;
END;
$function$;

-- Update try_deduct_credits with auto-refill logic
CREATE OR REPLACE FUNCTION public.try_deduct_credits(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_credits integer;
  _reset_at timestamptz;
  _max integer;
BEGIN
  -- Get current state
  SELECT credits, credits_reset_at, max_credits
  INTO _current_credits, _reset_at, _max
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Auto-refill if reset time has passed
  IF _reset_at IS NOT NULL AND now() >= _reset_at THEN
    _current_credits := _max;
    UPDATE profiles 
    SET credits = _max, credits_reset_at = NULL 
    WHERE user_id = p_user_id;
  END IF;

  -- Check if enough credits
  IF _current_credits < p_amount THEN
    RETURN false;
  END IF;

  -- Deduct
  UPDATE profiles
  SET credits = credits - p_amount,
      -- If credits will hit 0, start the 24h timer
      credits_reset_at = CASE 
        WHEN credits - p_amount <= 0 AND credits_reset_at IS NULL 
        THEN now() + interval '24 hours'
        ELSE credits_reset_at
      END
  WHERE user_id = p_user_id;

  RETURN true;
END;
$function$;

-- Also update the single-credit version for backward compat
CREATE OR REPLACE FUNCTION public.try_deduct_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.try_deduct_credits(p_user_id, 1);
END;
$function$;
