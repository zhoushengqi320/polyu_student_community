-- 自由讨论区：评论回复（楼中楼）

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS comments_parent_id_idx
  ON public.comments (parent_id)
  WHERE parent_id IS NOT NULL;

-- 回复的 parent 必须属于同一帖子（target_type=post 且 target_id 一致）
CREATE OR REPLACE FUNCTION public.validate_comment_parent()
RETURNS TRIGGER AS $$
DECLARE
  parent_row public.comments%ROWTYPE;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO parent_row FROM public.comments WHERE id = NEW.parent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'parent comment not found';
  END IF;

  IF parent_row.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'cannot reply to deleted comment';
  END IF;

  IF NEW.target_type IS DISTINCT FROM parent_row.target_type
     OR NEW.target_id IS DISTINCT FROM parent_row.target_id THEN
    RAISE EXCEPTION 'reply must belong to the same post as parent comment';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_validate_parent ON public.comments;
CREATE TRIGGER comments_validate_parent
  BEFORE INSERT OR UPDATE OF parent_id, target_type, target_id
  ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_comment_parent();
