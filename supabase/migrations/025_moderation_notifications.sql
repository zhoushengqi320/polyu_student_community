-- 社区治理：通知、内容风险分级、举报去重、临时封禁
-- 可重复执行（类型/列已存在时会跳过）

DO $$ BEGIN
  CREATE TYPE public.content_risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS risk_level public.content_risk_level NOT NULL DEFAULT 'low';

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS risk_level public.content_risk_level NOT NULL DEFAULT 'low';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reporter_warning_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS posts_risk_level_idx
  ON public.posts (risk_level, created_at DESC)
  WHERE module = 'forum' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS profiles_banned_until_idx
  ON public.profiles (banned_until)
  WHERE banned_until IS NOT NULL;

-- 同一用户对同一目标仅允许一条未结案举报
CREATE UNIQUE INDEX IF NOT EXISTS reports_unique_open_reporter_target
  ON public.reports (reporter_id, target_type, target_id)
  WHERE status IN ('pending', 'reviewing', 'reviewed');

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  metadata JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 系统自动化日志：admin_id 可空
ALTER TABLE public.admin_action_logs
  ALTER COLUMN admin_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        (status = 'banned' AND banned_until IS NULL)
        OR (banned_until IS NOT NULL AND banned_until > NOW())
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
