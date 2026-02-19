-- Add detail columns to backlog_items for storing full idea info
ALTER TABLE public.backlog_items
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS mvp_scope TEXT,
  ADD COLUMN IF NOT EXISTS monetization TEXT;