-- Store structured report extras (e.g. message context snapshots) separately from description.
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS metadata JSONB;
