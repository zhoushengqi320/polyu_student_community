-- 收紧公告前台可见性：排除已删除、已隐藏、预发布排队
-- 可重复执行

DROP POLICY IF EXISTS "announcements_public_read" ON public.announcements;
CREATE POLICY "announcements_public_read"
  ON public.announcements FOR SELECT
  USING (
    deleted_at IS NULL
    AND status = 'published'
    AND (published_at IS NULL OR published_at <= now())
    AND starts_at IS NOT NULL
    AND starts_at <= now()
    AND ends_at IS NOT NULL
    AND ends_at > now()
  );
