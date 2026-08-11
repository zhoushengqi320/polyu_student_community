-- 密码/OTP 登录注册 + 昵称头像审核
-- 在 017 之后执行

DO $$ BEGIN
  CREATE TYPE public.profile_review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.otp_purpose AS ENUM ('register', 'login', 'reset_password');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS approved_nickname TEXT,
  ADD COLUMN IF NOT EXISTS approved_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_review_status public.profile_review_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS review_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_first_setup_completed BOOLEAN NOT NULL DEFAULT false;

-- 与旧 onboarding 字段对齐
UPDATE public.profiles
SET is_first_setup_completed = true
WHERE onboarding_completed = true AND is_first_setup_completed = false;

UPDATE public.profiles
SET approved_nickname = COALESCE(approved_nickname, display_name),
    approved_avatar_url = COALESCE(approved_avatar_url, avatar_url)
WHERE profile_review_status = 'approved'
  AND (display_name IS NOT NULL OR avatar_url IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_lower_unique_idx
  ON public.profiles (LOWER(nickname))
  WHERE nickname IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_approved_nickname_lower_unique_idx
  ON public.profiles (LOWER(approved_nickname))
  WHERE approved_nickname IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_review_status_idx
  ON public.profiles (profile_review_status);

CREATE OR REPLACE FUNCTION public.sync_profile_setup_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_first_setup_completed IS DISTINCT FROM OLD.is_first_setup_completed THEN
    NEW.onboarding_completed := NEW.is_first_setup_completed;
  ELSIF NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed THEN
    NEW.is_first_setup_completed := NEW.onboarding_completed;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_sync_setup_flags ON public.profiles;
CREATE TRIGGER profiles_sync_setup_flags
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_setup_flags();

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

CREATE TABLE IF NOT EXISTS public.otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose public.otp_purpose NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  resend_available_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS otp_challenges_email_purpose_idx
  ON public.otp_challenges (email, purpose, created_at DESC);

CREATE INDEX IF NOT EXISTS otp_challenges_active_idx
  ON public.otp_challenges (email, purpose)
  WHERE consumed_at IS NULL;

ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.registration_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ,
  password_encrypted TEXT,
  grade TEXT,
  major TEXT,
  nickname TEXT,
  avatar_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registration_drafts_expires_at_idx
  ON public.registration_drafts (expires_at);

ALTER TABLE public.registration_drafts ENABLE ROW LEVEL SECURITY;

-- OTP / drafts 仅服务端 service role 访问，不开放 anon/authenticated 策略

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
CREATE POLICY "avatars_authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
CREATE POLICY "avatars_authenticated_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;
CREATE POLICY "avatars_authenticated_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 注册草稿阶段由 service role 上传，无需额外 policy
