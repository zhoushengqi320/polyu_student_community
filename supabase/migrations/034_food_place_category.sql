-- 吃喝玩乐地点：业态分类
ALTER TABLE public.food_places
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'restaurant';

CREATE INDEX IF NOT EXISTS food_places_category_idx
  ON public.food_places (category);

COMMENT ON COLUMN public.food_places.category IS
  '业态：restaurant/snack/dessert_drink/cafe/fast_food/night_snack/attraction/activity/sports/karaoke/board_game/other';
