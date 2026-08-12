-- 资料（昵称/头像）风险分级与后台关注队列

DO $$ BEGIN
  CREATE TYPE public.content_risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_risk_level public.content_risk_level NOT NULL DEFAULT 'low';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_risk_flags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_risk_attention BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS profiles_risk_attention_idx
  ON public.profiles (profile_risk_level, updated_at DESC)
  WHERE profile_risk_attention = TRUE
     OR profile_review_status = 'pending';
