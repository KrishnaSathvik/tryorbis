
-- Explicitly deny anonymous users from accessing profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles AS RESTRICTIVE FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous insert to profiles"
ON public.profiles AS RESTRICTIVE FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous update to profiles"
ON public.profiles AS RESTRICTIVE FOR UPDATE
TO anon
USING (false);
