-- 注册邮箱白名单：管理员可放行非 @connect.polyu.hk 邮箱
-- 使用后标记 consumed，保留记录；不可重复添加同一邮箱
-- 可重复执行

CREATE TABLE IF NOT EXISTS public.email_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ,
  consumed_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS email_whitelist_email_unique
  ON public.email_whitelist (lower(email));

CREATE INDEX IF NOT EXISTS email_whitelist_created_at_idx
  ON public.email_whitelist (created_at DESC);

CREATE INDEX IF NOT EXISTS email_whitelist_active_idx
  ON public.email_whitelist (created_at DESC)
  WHERE consumed_at IS NULL;

ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_whitelist_admin_all" ON public.email_whitelist;
CREATE POLICY "email_whitelist_admin_all"
  ON public.email_whitelist FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 新用户：理大邮箱，或未消费的白名单邮箱；权限与理大认证用户相同
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  temp_username TEXT;
  normalized_email TEXT;
BEGIN
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'only_polyu_email_allowed';
  END IF;

  normalized_email := lower(trim(NEW.email));

  IF normalized_email NOT LIKE '%@connect.polyu.hk' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.email_whitelist w
      WHERE lower(w.email) = normalized_email
        AND w.consumed_at IS NULL
    ) THEN
      RAISE EXCEPTION 'only_polyu_email_allowed';
    END IF;
  END IF;

  temp_username := 'u_' || replace(substr(NEW.id::text, 1, 8), '-', '');

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    role,
    polyu_verified_at,
    onboarding_completed,
    is_first_setup_completed,
    profile_review_status
  )
  VALUES (
    NEW.id,
    temp_username,
    NULL,
    'verified_polyu_user',
    NOW(),
    false,
    false,
    'approved'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
