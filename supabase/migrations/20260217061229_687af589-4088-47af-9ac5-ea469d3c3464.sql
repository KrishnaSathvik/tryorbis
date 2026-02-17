-- Fix profiles RLS: the current policy is RESTRICTIVE which blocks reads
-- Drop the restrictive policy and create a permissive one
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Fix generator_runs RLS
DROP POLICY IF EXISTS "Anyone can read generator_runs" ON public.generator_runs;
CREATE POLICY "Anyone can read generator_runs" 
ON public.generator_runs 
FOR SELECT 
USING (true);

-- Fix validation_reports RLS
DROP POLICY IF EXISTS "Anyone can read validation_reports" ON public.validation_reports;
CREATE POLICY "Anyone can read validation_reports" 
ON public.validation_reports 
FOR SELECT 
USING (true);

-- Fix backlog_items RLS - change restrictive to permissive
DROP POLICY IF EXISTS "Users can read own backlog" ON public.backlog_items;
CREATE POLICY "Users can read own backlog" 
ON public.backlog_items 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own backlog" ON public.backlog_items;
CREATE POLICY "Users can insert own backlog" 
ON public.backlog_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own backlog" ON public.backlog_items;
CREATE POLICY "Users can update own backlog" 
ON public.backlog_items 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own backlog" ON public.backlog_items;
CREATE POLICY "Users can delete own backlog" 
ON public.backlog_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix other restrictive policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own runs" ON public.generator_runs;
CREATE POLICY "Users can insert own runs" 
ON public.generator_runs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own runs" ON public.generator_runs;
CREATE POLICY "Users can delete own runs" 
ON public.generator_runs 
FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON public.validation_reports;
CREATE POLICY "Users can insert own reports" 
ON public.validation_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reports" ON public.validation_reports;
CREATE POLICY "Users can delete own reports" 
ON public.validation_reports 
FOR DELETE 
USING (auth.uid() = user_id);