-- 公告预发布排队状态
-- 可重复执行

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_status_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_status_check
  CHECK (status IN ('draft', 'scheduled', 'published', 'hidden', 'removed'));

CREATE INDEX IF NOT EXISTS announcements_scheduled_due_idx
  ON public.announcements (published_at ASC)
  WHERE deleted_at IS NULL AND status = 'scheduled';
