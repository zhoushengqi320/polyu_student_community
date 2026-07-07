-- PolyUHub: Course review aggregated stats
-- Store simple course-level stats for the simplified review model.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS overall_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS difficulty_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_tags JSONB NOT NULL DEFAULT '[]'::JSONB;

CREATE OR REPLACE FUNCTION public.refresh_course_review_stats(target_course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.courses
  SET
    overall_rating = stats.overall_rating,
    difficulty_rating = stats.difficulty_rating,
    review_count = stats.review_count,
    top_tags = stats.top_tags,
    updated_at = NOW()
  FROM (
    SELECT
      COUNT(*)::INTEGER AS review_count,
      ROUND(AVG(overall_rating)::NUMERIC, 2) AS overall_rating,
      ROUND(AVG(difficulty_rating)::NUMERIC, 2) AS difficulty_rating,
      COALESCE((
        SELECT JSONB_AGG(
          JSONB_BUILD_OBJECT('tag', tag, 'count', tag_count)
          ORDER BY tag_count DESC, tag ASC
        )
        FROM (
          SELECT tag, COUNT(*)::INTEGER AS tag_count
          FROM public.course_reviews cr
          CROSS JOIN LATERAL UNNEST(cr.tags) AS tag
          WHERE cr.course_id = target_course_id
            AND cr.status = 'published'
            AND cr.deleted_at IS NULL
          GROUP BY tag
          ORDER BY tag_count DESC, tag ASC
          LIMIT 8
        ) tag_stats
      ), '[]'::JSONB) AS top_tags
    FROM public.course_reviews
    WHERE course_id = target_course_id
      AND status = 'published'
      AND deleted_at IS NULL
  ) stats
  WHERE id = target_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_course_review_stats_from_reviews()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_course_review_stats(OLD.course_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_course_review_stats(NEW.course_id);

  IF TG_OP = 'UPDATE' AND OLD.course_id <> NEW.course_id THEN
    PERFORM public.refresh_course_review_stats(OLD.course_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS course_reviews_sync_course_stats ON public.course_reviews;
CREATE TRIGGER course_reviews_sync_course_stats
  AFTER INSERT OR UPDATE OR DELETE
  ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_course_review_stats_from_reviews();

DO $$
DECLARE
  course_record RECORD;
BEGIN
  FOR course_record IN SELECT id FROM public.courses LOOP
    PERFORM public.refresh_course_review_stats(course_record.id);
  END LOOP;
END $$;
