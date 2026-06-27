-- Magic Link 登录 + 资料完善 onboarding
-- 在 001、002 之后执行

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 已有用户视为已完成资料（避免被强制跳转 onboarding）
UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed = false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  temp_username TEXT;
BEGIN
  IF NEW.email IS NULL OR lower(trim(NEW.email)) NOT LIKE '%@connect.polyu.hk' THEN
    RAISE EXCEPTION 'only_polyu_email_allowed';
  END IF;

  temp_username := 'u_' || replace(substr(NEW.id::text, 1, 8), '-', '');

  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    role,
    polyu_verified_at,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    temp_username,
    NULL,
    'verified_polyu_user',
    NOW(),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
