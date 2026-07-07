-- PolyUHub: Simplify course reviews
-- Keep old detailed fields for compatibility, but add tags for the simplified review flow.

ALTER TABLE public.course_reviews
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS course_reviews_tags_idx
  ON public.course_reviews USING GIN (tags);
