-- 私信增强：引用 ID、更新追踪、撤回、拉黑、表情回应

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS quote_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS messages_quote_message_idx
  ON public.messages (quote_message_id)
  WHERE quote_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS messages_conversation_updated_idx
  ON public.messages (conversation_id, updated_at DESC);

DROP TRIGGER IF EXISTS messages_set_updated_at ON public.messages;
CREATE TRIGGER messages_set_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 发送者软删除（撤回）
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
CREATE POLICY "messages_update_sender"
  ON public.messages FOR UPDATE
  USING (
    auth.uid() = sender_id
    AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  )
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  );

-- 私信拉黑
CREATE TABLE IF NOT EXISTS public.message_blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT message_blocks_distinct CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS message_blocks_blocked_idx
  ON public.message_blocks (blocked_id);

ALTER TABLE public.message_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_blocks_select_own" ON public.message_blocks;
CREATE POLICY "message_blocks_select_own"
  ON public.message_blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "message_blocks_insert_self" ON public.message_blocks;
CREATE POLICY "message_blocks_insert_self"
  ON public.message_blocks FOR INSERT
  WITH CHECK (
    public.can_interact()
    AND auth.uid() = blocker_id
  );

DROP POLICY IF EXISTS "message_blocks_delete_self" ON public.message_blocks;
CREATE POLICY "message_blocks_delete_self"
  ON public.message_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- 表情回应
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_message_idx
  ON public.message_reactions (message_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_reactions_select_member" ON public.message_reactions;
CREATE POLICY "message_reactions_select_member"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  );

DROP POLICY IF EXISTS "message_reactions_insert_self" ON public.message_reactions;
CREATE POLICY "message_reactions_insert_self"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    public.can_interact()
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND m.deleted_at IS NULL
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  );

DROP POLICY IF EXISTS "message_reactions_delete_self" ON public.message_reactions;
CREATE POLICY "message_reactions_delete_self"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime（若 publication 不存在则跳过，需在 Supabase 控制台确认）
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

COMMENT ON TABLE public.message_blocks IS '用户私信拉黑';
COMMENT ON TABLE public.message_reactions IS '私信消息表情回应';
