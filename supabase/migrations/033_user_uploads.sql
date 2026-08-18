-- 用户 UGC 图片：Storage + 元数据表，正文仅存经绑定的插图 Markdown
CREATE TABLE IF NOT EXISTS public.user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'content-images',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  module TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'attached', 'deleted')),
  target_type TEXT,
  target_id UUID,
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attached_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE UNIQUE INDEX IF NOT EXISTS user_uploads_storage_path_idx
  ON public.user_uploads (storage_bucket, storage_path);

CREATE INDEX IF NOT EXISTS user_uploads_user_status_idx
  ON public.user_uploads (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS user_uploads_target_idx
  ON public.user_uploads (target_type, target_id)
  WHERE target_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_uploads_pending_expires_idx
  ON public.user_uploads (expires_at)
  WHERE status = 'pending';

ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_uploads_select_own" ON public.user_uploads;
CREATE POLICY "user_uploads_select_own"
  ON public.user_uploads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_uploads_admin_all" ON public.user_uploads;
CREATE POLICY "user_uploads_admin_all"
  ON public.user_uploads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

COMMENT ON TABLE public.user_uploads IS
  '用户上传的正文插图元数据；pending 未绑定内容，attached 已写入帖子/反馈等';
