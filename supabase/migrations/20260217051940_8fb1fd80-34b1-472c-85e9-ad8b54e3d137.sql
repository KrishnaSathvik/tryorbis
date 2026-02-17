
-- Profiles for anonymous users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Generator runs
CREATE TABLE public.generator_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona TEXT NOT NULL,
  category TEXT NOT NULL,
  region TEXT,
  budget_scope TEXT,
  platform TEXT,
  problem_clusters JSONB NOT NULL DEFAULT '[]'::jsonb,
  idea_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generator_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read generator_runs" ON public.generator_runs FOR SELECT USING (true);
CREATE POLICY "Users can insert own runs" ON public.generator_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own runs" ON public.generator_runs FOR DELETE USING (auth.uid() = user_id);

-- Validation reports
CREATE TABLE public.validation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_text TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  verdict TEXT NOT NULL CHECK (verdict IN ('Build', 'Pivot', 'Skip')),
  pros JSONB NOT NULL DEFAULT '[]'::jsonb,
  cons JSONB NOT NULL DEFAULT '[]'::jsonb,
  gap_opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,
  mvp_wedge TEXT,
  kill_test TEXT,
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.validation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read validation_reports" ON public.validation_reports FOR SELECT USING (true);
CREATE POLICY "Users can insert own reports" ON public.validation_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.validation_reports FOR DELETE USING (auth.uid() = user_id);

-- Backlog items
CREATE TABLE public.backlog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Generated', 'Validated')),
  source_id TEXT,
  demand_score INTEGER,
  overall_score INTEGER,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Exploring', 'Validated', 'Building', 'Archived')),
  notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own backlog" ON public.backlog_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backlog" ON public.backlog_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own backlog" ON public.backlog_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own backlog" ON public.backlog_items FOR DELETE USING (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous'), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for public trends
ALTER PUBLICATION supabase_realtime ADD TABLE public.generator_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.validation_reports;
