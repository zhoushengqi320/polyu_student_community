-- 违规内容封存库 + 举报失信标记
-- 可重复执行

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reporter_untrustworthy BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.content_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  module TEXT,
  title TEXT,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived_by UUID REFERENCES public.profiles(id),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  appeal_deadline TIMESTAMPTZ NOT NULL,
  restored_at TIMESTAMPTZ,
  restored_by UUID REFERENCES public.profiles(id),
  appeal_note TEXT
);

CREATE INDEX IF NOT EXISTS content_archives_target_idx
  ON public.content_archives (target_type, target_id, archived_at DESC);

CREATE INDEX IF NOT EXISTS content_archives_appeal_deadline_idx
  ON public.content_archives (appeal_deadline)
  WHERE restored_at IS NULL;

ALTER TABLE public.content_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_archives_admin_all" ON public.content_archives;
CREATE POLICY "content_archives_admin_all"
  ON public.content_archives
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 作者可查看自己相关封存记录（用于申诉时效校验；写入由服务端/管理员策略处理）
DROP POLICY IF EXISTS "content_archives_select_own_related" ON public.content_archives;
CREATE POLICY "content_archives_select_own_related"
  ON public.content_archives
  FOR SELECT
  USING (
    public.is_admin()
    OR (snapshot ->> 'owner_id') = auth.uid()::text
  );
