-- 访客点赞：用 cookie 中的 visitor_id 去重，刷新后不可重复点赞
-- 仅允许 like；收藏等仍需登录用户写入 reactions 表

CREATE TABLE IF NOT EXISTS public.guest_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  target_type public.target_type NOT NULL,
  target_id UUID NOT NULL,
  type public.reaction_type NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT guest_reactions_unique UNIQUE (visitor_id, target_type, target_id, type),
  CONSTRAINT guest_reactions_like_only CHECK (type = 'like')
);

CREATE INDEX IF NOT EXISTS guest_reactions_target_idx
  ON public.guest_reactions (target_type, target_id);

CREATE INDEX IF NOT EXISTS guest_reactions_visitor_idx
  ON public.guest_reactions (visitor_id);

ALTER TABLE public.guest_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guest_reactions_select_public" ON public.guest_reactions;
CREATE POLICY "guest_reactions_select_public"
  ON public.guest_reactions FOR SELECT
  USING (TRUE);

-- 写入仅通过服务端 service role（跳过 RLS），避免匿名伪造/批量删除
