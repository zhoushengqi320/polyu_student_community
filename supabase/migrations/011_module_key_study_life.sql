-- PolyUHub: extend module_key for study / life site modules
-- Keep legacy 'resources' enum value for existing DB rows; app no longer exposes the module.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'module_key' AND e.enumlabel = 'study'
  ) THEN
    ALTER TYPE public.module_key ADD VALUE 'study';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'module_key' AND e.enumlabel = 'life'
  ) THEN
    ALTER TYPE public.module_key ADD VALUE 'life';
  END IF;
END $$;
