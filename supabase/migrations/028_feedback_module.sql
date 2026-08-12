-- 问题反馈模块：扩展 posts.module 枚举

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'module_key' AND e.enumlabel = 'feedback'
  ) THEN
    ALTER TYPE public.module_key ADD VALUE 'feedback';
  END IF;
END $$;
