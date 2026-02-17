
-- Update handle_new_user to give 20 credits for email users, 5 for anonymous/guest
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _credits integer;
  _display_name text;
BEGIN
  -- Anonymous users get 5 credits, email users get 20
  IF NEW.is_anonymous = true THEN
    _credits := 5;
  ELSE
    _credits := 20;
  END IF;
  
  _display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous');
  
  INSERT INTO public.profiles (user_id, display_name, email, credits)
  VALUES (NEW.id, _display_name, NEW.email, _credits);
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger (drop first to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add missing UPDATE RLS policies
CREATE POLICY "Users can update own runs"
ON public.generator_runs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
ON public.validation_reports
FOR UPDATE
USING (auth.uid() = user_id);

-- Add device_fingerprint to profiles for anti-abuse tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_fingerprint text;
