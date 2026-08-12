-- 问题反馈：允许已登录可互动用户发帖（不要求理大认证）

DROP POLICY IF EXISTS "posts_insert_feedback" ON public.posts;
CREATE POLICY "posts_insert_feedback"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND module = 'feedback'
    AND public.can_interact()
  );
