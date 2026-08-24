-- 修复私信 RLS：避免 conversation_members 策略自引用导致 infinite recursion

DROP POLICY IF EXISTS "conversation_members_select_own" ON public.conversation_members;
DROP POLICY IF EXISTS "conversation_members_select_member" ON public.conversation_members;

CREATE POLICY "conversation_members_select_member"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND (auth.uid() = c.user_low_id OR auth.uid() = c.user_high_id)
    )
  );

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

-- 补全已有会话但缺少 member 行的数据
INSERT INTO public.conversation_members (conversation_id, user_id)
SELECT c.id, c.user_low_id
FROM public.conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversation_members cm
  WHERE cm.conversation_id = c.id AND cm.user_id = c.user_low_id
);

INSERT INTO public.conversation_members (conversation_id, user_id)
SELECT c.id, c.user_high_id
FROM public.conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversation_members cm
  WHERE cm.conversation_id = c.id AND cm.user_id = c.user_high_id
);
