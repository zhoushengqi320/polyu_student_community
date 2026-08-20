-- 全站公告：首页展示活动招募、维护升级、功能更新等官方通知
-- 可重复执行

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  link_label TEXT,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('activity', 'maintenance', 'update', 'general')),
  variant TEXT NOT NULL DEFAULT 'info'
    CHECK (variant IN ('info', 'warning', 'success')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'hidden', 'removed')),
  published_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS announcements_active_idx
  ON public.announcements (is_pinned DESC, published_at DESC NULLS LAST)
  WHERE deleted_at IS NULL AND status = 'published';

CREATE INDEX IF NOT EXISTS announcements_admin_list_idx
  ON public.announcements (updated_at DESC)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS announcements_set_updated_at ON public.announcements;
CREATE TRIGGER announcements_set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_public_read" ON public.announcements;
CREATE POLICY "announcements_public_read"
  ON public.announcements FOR SELECT
  USING (
    deleted_at IS NULL
    AND status = 'published'
    AND (published_at IS NULL OR published_at <= now())
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "announcements_admin_all" ON public.announcements;
CREATE POLICY "announcements_admin_all"
  ON public.announcements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
