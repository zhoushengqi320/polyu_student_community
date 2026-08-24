-- 二手市集：移除地区字段（campus_area）

DROP INDEX IF EXISTS public.marketplace_listings_campus_area_idx;

ALTER TABLE public.marketplace_listings
  DROP COLUMN IF EXISTS campus_area;
