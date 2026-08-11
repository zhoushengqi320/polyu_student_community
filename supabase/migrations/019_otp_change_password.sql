-- 为已登录用户修改密码增加 OTP 用途
DO $$ BEGIN
  ALTER TYPE public.otp_purpose ADD VALUE 'change_password';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
