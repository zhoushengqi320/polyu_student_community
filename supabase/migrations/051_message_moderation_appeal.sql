-- 私信违规隐藏与申诉

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS moderation_hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS appeal_status TEXT NOT NULL DEFAULT 'none'
    CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS appeal_note TEXT,
  ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS messages_appeal_pending_idx
  ON public.messages (appeal_submitted_at DESC)
  WHERE appeal_status = 'pending';

COMMENT ON COLUMN public.messages.moderation_hidden_at IS '管理员确认违规后隐藏原内容，会话内显示占位提示';
