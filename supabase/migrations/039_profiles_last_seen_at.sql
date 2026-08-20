-- 用户最后访问时间（仅用于后台活跃度，前台不展示）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_last_seen_at_idx
  ON public.profiles (last_seen_at DESC NULLS LAST);

COMMENT ON COLUMN public.profiles.last_seen_at IS
  'Throttled heartbeat from middleware; admin activity scoring only.';
