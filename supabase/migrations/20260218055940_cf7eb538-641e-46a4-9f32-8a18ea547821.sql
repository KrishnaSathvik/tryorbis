
-- Create a function that deducts N credits (for deep research mode)
CREATE OR REPLACE FUNCTION public.try_deduct_credits(p_user_id uuid, p_amount integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE user_id = p_user_id AND credits >= p_amount;
  
  RETURN FOUND;
END;
$$;
