-- 1. Reset all existing users to 2 free reports (fresh start for new pricing model)
UPDATE public.profiles SET max_credits = 2, credits = 2, credits_reset_at = NULL;

-- 2. Change default for new users
ALTER TABLE public.profiles ALTER COLUMN max_credits SET DEFAULT 2;
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 2;

-- 3. Replace handle_new_user — both guests and registered get 2 reports
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _display_name text;
BEGIN
  _display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous');

  INSERT INTO public.profiles (user_id, display_name, email, credits, max_credits)
  VALUES (NEW.id, _display_name, NEW.email, 2, 2);

  RETURN NEW;
END;
$function$;

-- 4. Replace try_deduct_credits — no auto-refill, no reset timer
CREATE OR REPLACE FUNCTION public.try_deduct_credits(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current_credits integer;
BEGIN
  SELECT credits
  INTO _current_credits
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF _current_credits < p_amount THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET credits = credits - p_amount
  WHERE user_id = p_user_id;

  RETURN true;
END;
$function$;

-- 5. try_deduct_credit wrapper stays the same (calls try_deduct_credits with 1)
-- No change needed — it already delegates.

-- 6. Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can join waitlist"
  ON public.waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon users can join waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);
