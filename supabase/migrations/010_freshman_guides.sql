-- PolyUHub: Freshman Guides foundation
-- Reuse posts as guide content and keep guides_meta for guide-specific metadata.

ALTER TABLE public.guides_meta
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS estimated_reading_time INTEGER,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_links JSONB NOT NULL DEFAULT '[]'::JSONB;

UPDATE public.guides_meta
SET category = stage
WHERE category IS NULL;

ALTER TABLE public.guides_meta
  DROP CONSTRAINT IF EXISTS guides_meta_estimated_reading_time_check;

ALTER TABLE public.guides_meta
  ADD CONSTRAINT guides_meta_estimated_reading_time_check
  CHECK (
    estimated_reading_time IS NULL
    OR estimated_reading_time BETWEEN 1 AND 120
  );

CREATE INDEX IF NOT EXISTS guides_meta_category_idx
  ON public.guides_meta (category);
