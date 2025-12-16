-- 0004_add_created_at_to_physical_health.sql
-- Adds missing created_at column to physical_health table

ALTER TABLE public.physical_health
ADD COLUMN created_at timestamptz DEFAULT now();

-- Create index on created_at for ordering queries
CREATE INDEX IF NOT EXISTS physical_health_created_at_idx ON public.physical_health (created_at DESC);
