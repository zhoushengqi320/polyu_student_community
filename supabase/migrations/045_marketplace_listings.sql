-- 二手市集：独立 listing 表 + target_type / module_key 扩展

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'module_key' AND e.enumlabel = 'market'
  ) THEN
    ALTER TYPE public.module_key ADD VALUE 'market';
  END IF;
END $$;

ALTER TYPE public.target_type ADD VALUE IF NOT EXISTS 'market_listing';

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id TEXT NOT NULL DEFAULT 'polyu',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_hkd INTEGER NOT NULL CHECK (price_hkd >= 0 AND price_hkd <= 1000000),
  price_negotiable BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  trade_methods TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  contact_note TEXT,
  image_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  listing_status TEXT NOT NULL DEFAULT 'available'
    CHECK (listing_status IN ('available', 'reserved', 'sold')),
  status public.content_status NOT NULL DEFAULT 'published',
  view_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT marketplace_listings_title_length CHECK (char_length(title) BETWEEN 2 AND 80),
  CONSTRAINT marketplace_listings_description_length CHECK (char_length(description) BETWEEN 10 AND 5000),
  CONSTRAINT marketplace_listings_category_check CHECK (
    category IN (
      'textbook',
      'electronics',
      'furniture',
      'apparel',
      'sports',
      'tickets',
      'other'
    )
  ),
  CONSTRAINT marketplace_listings_condition_check CHECK (
    condition IN ('new', 'like_new', 'good', 'fair')
  ),
  CONSTRAINT marketplace_listings_contact_note_length CHECK (
    contact_note IS NULL OR char_length(contact_note) <= 200
  )
);

CREATE INDEX IF NOT EXISTS marketplace_listings_status_created_idx
  ON public.marketplace_listings (status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS marketplace_listings_user_id_idx
  ON public.marketplace_listings (user_id);

CREATE INDEX IF NOT EXISTS marketplace_listings_category_idx
  ON public.marketplace_listings (category)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS marketplace_listings_listing_status_idx
  ON public.marketplace_listings (listing_status)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS marketplace_listings_set_updated_at ON public.marketplace_listings;
CREATE TRIGGER marketplace_listings_set_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marketplace_listings_select_published" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_select_published"
  ON public.marketplace_listings FOR SELECT
  USING (
    (status = 'published' AND deleted_at IS NULL)
    OR auth.uid() = user_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "marketplace_listings_insert_verified" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_insert_verified"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_interact()
    AND (
      public.is_verified_polyu_user()
      OR public.is_admin()
    )
    AND status = 'published'
  );

DROP POLICY IF EXISTS "marketplace_listings_update_own" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_update_own"
  ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = user_id AND public.can_interact())
  WITH CHECK (auth.uid() = user_id AND public.can_interact());

DROP POLICY IF EXISTS "marketplace_listings_admin_all" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_admin_all"
  ON public.marketplace_listings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON TABLE public.marketplace_listings IS
  'Campus second-hand marketplace listings (PolyUHub 二手市集).';
