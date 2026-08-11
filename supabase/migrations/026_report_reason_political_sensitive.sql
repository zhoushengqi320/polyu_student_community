-- 举报原因增加「政治敏感」

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reason_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reason_check CHECK (
    reason IN (
      'spam',
      'scam',
      'academic_misconduct',
      'harassment',
      'hate_speech',
      'sexual_content',
      'false_information',
      'political_sensitive',
      'privacy',
      'other'
    )
  );
