-- 封存申诉状态：作者提交申诉后由管理员审核，不自动恢复
-- 可重复执行

ALTER TABLE public.content_archives
  ADD COLUMN IF NOT EXISTS appeal_status TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.content_archives
  ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMPTZ;

ALTER TABLE public.content_archives
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'content_archives_appeal_status_check'
  ) THEN
    ALTER TABLE public.content_archives
      ADD CONSTRAINT content_archives_appeal_status_check
      CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS content_archives_pending_appeals_idx
  ON public.content_archives (appeal_submitted_at DESC)
  WHERE appeal_status = 'pending'
    AND restored_at IS NULL
    AND expired_at IS NULL;

CREATE INDEX IF NOT EXISTS content_archives_active_deadline_idx
  ON public.content_archives (appeal_deadline)
  WHERE restored_at IS NULL
    AND expired_at IS NULL;
