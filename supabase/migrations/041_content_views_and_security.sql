-- 内容浏览记录（谁看过），供后台详情查看
CREATE TABLE IF NOT EXISTS public.content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.target_type NOT NULL,
  target_id uuid NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_views_actor_check CHECK (
    user_id IS NOT NULL OR (visitor_id IS NOT NULL AND length(visitor_id) > 0)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS content_views_user_target_uidx
  ON public.content_views (user_id, target_type, target_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS content_views_visitor_target_uidx
  ON public.content_views (visitor_id, target_type, target_id)
  WHERE user_id IS NULL AND visitor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_views_target_idx
  ON public.content_views (target_type, target_id, last_viewed_at DESC);

ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

-- 前台不开放读取；写入仅走 service role（Server Action）
DROP POLICY IF EXISTS content_views_admin_select ON public.content_views;
CREATE POLICY content_views_admin_select
  ON public.content_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'active'
    )
  );

COMMENT ON TABLE public.content_views IS
  'Per-user/visitor view ledger for admin audit; inserts via service role.';

-- 防止用户通过 RLS 自提权：锁定 profiles 敏感列
CREATE OR REPLACE FUNCTION public.protect_profiles_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service role / 系统写入：auth.uid() 为空时放行
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'active'
    )
  ) THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Cannot change role';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Cannot change status';
    END IF;
    IF NEW.polyu_verified_at IS DISTINCT FROM OLD.polyu_verified_at THEN
      RAISE EXCEPTION 'Cannot change polyu_verified_at';
    END IF;
    IF NEW.school_id IS DISTINCT FROM OLD.school_id THEN
      RAISE EXCEPTION 'Cannot change school_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_sensitive_columns ON public.profiles;
CREATE TRIGGER profiles_protect_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_sensitive_columns();

-- 防止作者把已隐藏内容擅自改回 published
CREATE OR REPLACE FUNCTION public.protect_content_status_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.status = 'active'
    )
  ) THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Cannot change content status';
    END IF;
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
       AND NEW.deleted_at IS NULL THEN
      RAISE EXCEPTION 'Cannot restore deleted content';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_protect_status ON public.posts;
CREATE TRIGGER posts_protect_status
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_status_columns();

DROP TRIGGER IF EXISTS comments_protect_status ON public.comments;
CREATE TRIGGER comments_protect_status
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_status_columns();
