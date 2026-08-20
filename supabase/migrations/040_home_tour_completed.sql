-- 首页新手引导完成时间（注册后首次访问首页时使用）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_tour_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.home_tour_completed_at IS
  'When the user finished the homepage product tour; NULL means not yet shown/completed.';

-- 已有账号视为已完成，避免老用户再次看到引导
UPDATE public.profiles
SET home_tour_completed_at = COALESCE(created_at, now())
WHERE home_tour_completed_at IS NULL;
