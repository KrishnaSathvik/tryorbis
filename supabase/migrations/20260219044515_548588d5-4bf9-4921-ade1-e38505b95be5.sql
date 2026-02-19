
-- Add intelligence layer columns to generator_runs
ALTER TABLE public.generator_runs
  ADD COLUMN IF NOT EXISTS wtp_signals jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competition_density jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS market_timing jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS icp jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS workaround_detection jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS feature_gap_map jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS platform_risk jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gtm_strategy jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pricing_benchmarks jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS defensibility jsonb DEFAULT NULL;

-- Add intelligence layer columns to validation_reports
ALTER TABLE public.validation_reports
  ADD COLUMN IF NOT EXISTS market_sizing jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wtp_signals jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS competition_density jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS market_timing jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS icp jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS workaround_detection jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS feature_gap_map jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS platform_risk jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gtm_strategy jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pricing_benchmarks jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS defensibility jsonb DEFAULT NULL;
