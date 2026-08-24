-- 移除已废弃的私信表情回应表

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.message_reactions;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN undefined_table THEN NULL;
  WHEN invalid_table_definition THEN NULL;
END $$;

DROP POLICY IF EXISTS "message_reactions_select_member" ON public.message_reactions;
DROP POLICY IF EXISTS "message_reactions_insert_self" ON public.message_reactions;
DROP POLICY IF EXISTS "message_reactions_delete_self" ON public.message_reactions;

DROP INDEX IF EXISTS message_reactions_message_idx;
DROP TABLE IF EXISTS public.message_reactions;
