
-- Fix backlog_items policies
DROP POLICY IF EXISTS "Users can read own backlog" ON backlog_items;
DROP POLICY IF EXISTS "Users can insert own backlog" ON backlog_items;
DROP POLICY IF EXISTS "Users can update own backlog" ON backlog_items;
DROP POLICY IF EXISTS "Users can delete own backlog" ON backlog_items;

CREATE POLICY "Users can read own backlog" ON backlog_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backlog" ON backlog_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own backlog" ON backlog_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own backlog" ON backlog_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix generator_runs policies
DROP POLICY IF EXISTS "Users can read own runs" ON generator_runs;
DROP POLICY IF EXISTS "Users can insert own runs" ON generator_runs;
DROP POLICY IF EXISTS "Users can update own runs" ON generator_runs;
DROP POLICY IF EXISTS "Users can delete own runs" ON generator_runs;

CREATE POLICY "Users can read own runs" ON generator_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own runs" ON generator_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runs" ON generator_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own runs" ON generator_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix validation_reports policies
DROP POLICY IF EXISTS "Users can read own reports" ON validation_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON validation_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON validation_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON validation_reports;

CREATE POLICY "Users can read own reports" ON validation_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON validation_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON validation_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON validation_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix profiles policies (keep deny-anonymous ones, fix user ones)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON profiles;
DROP POLICY IF EXISTS "Deny anonymous insert to profiles" ON profiles;
DROP POLICY IF EXISTS "Deny anonymous update to profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Fix feedback policies
DROP POLICY IF EXISTS "Authenticated users can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Service role can read all feedback" ON feedback;

CREATE POLICY "Authenticated users can submit feedback" ON feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can read own feedback" ON feedback FOR SELECT TO authenticated USING ((auth.uid())::text = user_id);
