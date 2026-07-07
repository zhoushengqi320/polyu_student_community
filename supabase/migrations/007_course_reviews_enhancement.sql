-- PolyUHub: Course reviews enhancement
-- Adds structured official course fields, richer review fields, and course-level reactions.

-- Allow users to favorite courses directly while keeping course reviews reportable/reactable.
ALTER TYPE public.target_type ADD VALUE IF NOT EXISTS 'course';

-- ============================================================
-- Courses: official PDF-derived structured information
-- ============================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS faculty TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS objectives TEXT,
  ADD COLUMN IF NOT EXISTS prerequisites TEXT,
  ADD COLUMN IF NOT EXISTS teaching_pattern TEXT,
  ADD COLUMN IF NOT EXISTS semester_offered TEXT,
  ADD COLUMN IF NOT EXISTS assessment_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS source_file_name TEXT,
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_pdf_url_format;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_pdf_url_format
  CHECK (pdf_url IS NULL OR pdf_url ~ '^https?://');

CREATE INDEX IF NOT EXISTS courses_name_idx ON public.courses (name);
CREATE INDEX IF NOT EXISTS courses_faculty_idx ON public.courses (faculty);
CREATE INDEX IF NOT EXISTS courses_level_idx ON public.courses (level);
CREATE INDEX IF NOT EXISTS courses_source_updated_at_idx
  ON public.courses (source_updated_at DESC);

-- ============================================================
-- Course reviews: student experience fields
-- ============================================================
ALTER TABLE public.course_reviews
  ADD COLUMN IF NOT EXISTS teacher_name TEXT,
  ADD COLUMN IF NOT EXISTS exam_difficulty SMALLINT CHECK (exam_difficulty BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS exam_type TEXT,
  ADD COLUMN IF NOT EXISTS assignment_type TEXT,
  ADD COLUMN IF NOT EXISTS attendance_required TEXT,
  ADD COLUMN IF NOT EXISTS review_text TEXT,
  ADD COLUMN IF NOT EXISTS tips TEXT,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.course_reviews
SET review_text = content
WHERE review_text IS NULL;

ALTER TABLE public.course_reviews
  DROP CONSTRAINT IF EXISTS course_reviews_review_text_length;

ALTER TABLE public.course_reviews
  ADD CONSTRAINT course_reviews_review_text_length
  CHECK (review_text IS NULL OR char_length(review_text) BETWEEN 10 AND 5000);

ALTER TABLE public.course_reviews
  DROP CONSTRAINT IF EXISTS course_reviews_attendance_required_check;

ALTER TABLE public.course_reviews
  ADD CONSTRAINT course_reviews_attendance_required_check
  CHECK (
    attendance_required IS NULL
    OR attendance_required IN ('required', 'recommended', 'not_required', 'unknown')
  );

CREATE INDEX IF NOT EXISTS course_reviews_teacher_name_idx
  ON public.course_reviews (teacher_name);
CREATE INDEX IF NOT EXISTS course_reviews_created_at_idx
  ON public.course_reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS course_reviews_course_status_created_idx
  ON public.course_reviews (course_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Keep the first version conservative: one active review per user per course.
-- Future migrations can relax this to include semester / teacher_name if needed.
