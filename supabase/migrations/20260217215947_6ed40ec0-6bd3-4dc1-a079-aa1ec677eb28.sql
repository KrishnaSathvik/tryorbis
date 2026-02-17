
CREATE OR REPLACE FUNCTION public.try_deduct_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET credits = credits - 1
  WHERE user_id = p_user_id AND credits > 0;
  
  RETURN FOUND;
END;
$$;
