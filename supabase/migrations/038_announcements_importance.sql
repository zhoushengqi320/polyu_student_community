-- 展示样式改为重要等级：普通 / 重要
-- 可重复执行（先删约束、再改数据、再加约束）

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT con.conname
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'announcements'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%variant%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS %I',
      constraint_record.conname
    );
  END LOOP;
END $$;

UPDATE public.announcements
SET variant = 'important'
WHERE variant = 'warning';

UPDATE public.announcements
SET variant = 'normal'
WHERE variant IN ('info', 'success');

UPDATE public.announcements
SET variant = 'normal'
WHERE variant IS NULL
   OR variant NOT IN ('normal', 'important');

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_variant_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_variant_check
  CHECK (variant IN ('normal', 'important'));

ALTER TABLE public.announcements
  ALTER COLUMN variant SET DEFAULT 'normal';
