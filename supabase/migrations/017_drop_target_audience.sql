-- Remove target audience from guides metadata

ALTER TABLE public.guides_meta
  DROP COLUMN IF EXISTS target_audience;
