-- 私信：1:1 会话 + 消息

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_high_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversations_distinct_users CHECK (user_low_id <> user_high_id),
  CONSTRAINT conversations_ordered_users CHECK (user_low_id < user_high_id),
  UNIQUE (user_low_id, user_high_id)
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT,
  content_type TEXT NOT NULL DEFAULT 'text'
    CHECK (content_type IN ('text', 'image', 'video', 'mixed')),
  attachment_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  attachment_mime_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT messages_body_length CHECK (body IS NULL OR char_length(body) <= 5000),
  CONSTRAINT messages_has_content CHECK (
    (body IS NOT NULL AND char_length(trim(body)) > 0)
    OR cardinality(attachment_urls) > 0
  )
);

CREATE INDEX IF NOT EXISTS conversations_last_message_idx
  ON public.conversations (last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS conversation_members_user_idx
  ON public.conversation_members (user_id);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at ASC)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS conversations_set_updated_at ON public.conversations;
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- conversations：仅参与者可读
DROP POLICY IF EXISTS "conversations_select_member" ON public.conversations;
CREATE POLICY "conversations_select_member"
  ON public.conversations FOR SELECT
  USING (
    auth.uid() = user_low_id OR auth.uid() = user_high_id
  );

DROP POLICY IF EXISTS "conversations_insert_participant" ON public.conversations;
CREATE POLICY "conversations_insert_participant"
  ON public.conversations FOR INSERT
  WITH CHECK (
    public.can_interact()
    AND (
      auth.uid() = user_low_id OR auth.uid() = user_high_id
    )
  );

DROP POLICY IF EXISTS "conversations_update_member" ON public.conversations;
CREATE POLICY "conversations_update_member"
  ON public.conversations FOR UPDATE
  USING (
    auth.uid() = user_low_id OR auth.uid() = user_high_id
  )
  WITH CHECK (
    auth.uid() = user_low_id OR auth.uid() = user_high_id
  );

-- conversation_members
DROP POLICY IF EXISTS "conversation_members_select_own" ON public.conversation_members;
CREATE POLICY "conversation_members_select_member"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  );

DROP POLICY IF EXISTS "conversation_members_insert_self" ON public.conversation_members;
CREATE POLICY "conversation_members_insert_self"
  ON public.conversation_members FOR INSERT
  WITH CHECK (
    public.can_interact()
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.user_low_id = auth.uid() OR c.user_high_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "conversation_members_update_own" ON public.conversation_members;
CREATE POLICY "conversation_members_update_own"
  ON public.conversation_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- messages
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member"
  ON public.messages FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  );

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender"
  ON public.messages FOR INSERT
  WITH CHECK (
    public.can_interact()
    AND auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  );

DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;
CREATE POLICY "messages_admin_all"
  ON public.messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON TABLE public.conversations IS '1:1 私信会话';
COMMENT ON TABLE public.messages IS '私信消息（文字 / 图片 / 视频）';
