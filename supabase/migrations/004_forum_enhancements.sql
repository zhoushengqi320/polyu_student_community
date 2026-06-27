-- 自由讨论区增强：摘要、话题、计数、热度、匿名

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS excerpt TEXT,
  ADD COLUMN IF NOT EXISTS topics TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hot_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS posts_hot_score_idx
  ON public.posts (hot_score DESC, created_at DESC)
  WHERE module = 'forum' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS posts_forum_created_idx
  ON public.posts (created_at DESC)
  WHERE module = 'forum' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS posts_forum_category_idx
  ON public.posts (category_id)
  WHERE module = 'forum' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS posts_forum_topics_gin_idx
  ON public.posts USING GIN (topics)
  WHERE module = 'forum' AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.compute_post_hot_score(
  likes INTEGER,
  comments INTEGER,
  views INTEGER
)
RETURNS INTEGER AS $$
  SELECT COALESCE(likes, 0) * 3 + COALESCE(comments, 0) * 5 + COALESCE(views, 0) * 1;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.posts_sync_hot_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hot_score := public.compute_post_hot_score(
    NEW.like_count,
    NEW.comment_count,
    NEW.view_count
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_sync_hot_score_trigger ON public.posts;
CREATE TRIGGER posts_sync_hot_score_trigger
  BEFORE INSERT OR UPDATE OF like_count, comment_count, view_count
  ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_sync_hot_score();

CREATE OR REPLACE FUNCTION public.sync_post_comment_count_from_comments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' AND NEW.deleted_at IS NULL THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.target_type = 'post' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE public.posts
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = NEW.target_id;
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE public.posts
      SET comment_count = comment_count + 1
      WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' AND OLD.deleted_at IS NULL THEN
    UPDATE public.posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS comments_sync_post_count ON public.comments;
CREATE TRIGGER comments_sync_post_count
  AFTER INSERT OR UPDATE OF deleted_at OR DELETE
  ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count_from_comments();

CREATE OR REPLACE FUNCTION public.sync_post_like_count_from_reactions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' AND NEW.type = 'like' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' AND OLD.type = 'like' THEN
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS reactions_sync_post_like_count ON public.reactions;
CREATE TRIGGER reactions_sync_post_like_count
  AFTER INSERT OR DELETE
  ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_like_count_from_reactions();

CREATE OR REPLACE FUNCTION public.increment_post_view_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = post_id
    AND module = 'forum'
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_post_view_count(UUID) TO anon, authenticated, service_role;

-- 回填已有帖子的计数
UPDATE public.posts p
SET
  comment_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM public.comments c
    WHERE c.target_type = 'post'
      AND c.target_id = p.id
      AND c.deleted_at IS NULL
      AND c.status = 'published'
  ), 0),
  like_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM public.reactions r
    WHERE r.target_type = 'post'
      AND r.target_id = p.id
      AND r.type = 'like'
  ), 0);

UPDATE public.posts
SET hot_score = public.compute_post_hot_score(like_count, comment_count, view_count)
WHERE module = 'forum';
