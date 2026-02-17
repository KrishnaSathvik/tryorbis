-- Fix overly permissive SELECT policies

-- generator_runs: restrict to owner only
DROP POLICY IF EXISTS "Anyone can read generator_runs" ON public.generator_runs;
CREATE POLICY "Users can read own runs"
  ON public.generator_runs
  FOR SELECT
  USING (auth.uid() = user_id);

-- validation_reports: restrict to owner only
DROP POLICY IF EXISTS "Anyone can read validation_reports" ON public.validation_reports;
CREATE POLICY "Users can read own reports"
  ON public.validation_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- profiles: restrict to own profile only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);