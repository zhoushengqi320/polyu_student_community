-- Remove estimated reading time from guides metadata

ALTER TABLE public.guides_meta
  DROP CONSTRAINT IF EXISTS guides_meta_estimated_reading_time_check;

ALTER TABLE public.guides_meta
  DROP COLUMN IF EXISTS estimated_reading_time;
