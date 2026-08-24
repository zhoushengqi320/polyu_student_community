-- 重算会话 preview：取各会话最新未删消息的 body 摘要（去掉 > 前缀的简易版）

UPDATE public.conversations c
SET last_message_preview = sub.preview
FROM (
  SELECT DISTINCT ON (m.conversation_id)
    m.conversation_id,
    CASE
      WHEN trim(COALESCE(m.body, '')) = '' THEN
        CASE
          WHEN m.content_type IN ('video', 'mixed') AND cardinality(m.attachment_urls) > 0 THEN '[视频]'
          WHEN cardinality(m.attachment_urls) > 0 THEN '[图片]'
          ELSE '新消息'
        END
      ELSE
        left(
          regexp_replace(
            regexp_replace(trim(m.body), '^>\s*', '', 'g'),
            E'[\\n\\r]+',
            ' ',
            'g'
          ),
          80
        )
    END AS preview
  FROM public.messages m
  WHERE m.deleted_at IS NULL
  ORDER BY m.conversation_id, m.created_at DESC
) sub
WHERE c.id = sub.conversation_id;
