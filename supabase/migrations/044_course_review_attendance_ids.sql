-- 出勤要求：与前台 COURSE_ATTENDANCE_OPTIONS 对齐，并保留历史枚举值
ALTER TABLE public.course_reviews
  DROP CONSTRAINT IF EXISTS course_reviews_attendance_required_check;

ALTER TABLE public.course_reviews
  ADD CONSTRAINT course_reviews_attendance_required_check
  CHECK (
    attendance_required IS NULL
    OR attendance_required IN (
      'required',
      'recommended',
      'not_required',
      'unknown',
      'every_class',
      'spot_check',
      'none',
      'eighty_percent'
    )
  );
