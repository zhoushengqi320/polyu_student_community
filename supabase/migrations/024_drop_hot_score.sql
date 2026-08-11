-- 移除热度（hot_score）系统；浏览量仍由应用层在进入详情页时累计

DROP TRIGGER IF EXISTS posts_sync_hot_score_trigger ON public.posts;
DROP FUNCTION IF EXISTS public.posts_sync_hot_score();
DROP FUNCTION IF EXISTS public.compute_post_hot_score(INTEGER, INTEGER, INTEGER);
DROP INDEX IF EXISTS posts_hot_score_idx;

ALTER TABLE public.posts DROP COLUMN IF EXISTS hot_score;

CREATE INDEX IF NOT EXISTS posts_view_count_idx
  ON public.posts (view_count DESC, created_at DESC)
  WHERE module = 'forum' AND deleted_at IS NULL;
