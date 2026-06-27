-- 自由讨论区举报与管理增强

-- 新增 reviewed 状态（保留 reviewing 以兼容旧数据）
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'reviewed';

-- 迁移旧举报原因到新枚举值
UPDATE public.reports
SET reason = 'false_information'
WHERE reason = 'misinformation';

UPDATE public.reports
SET reason = 'other'
WHERE reason = 'inappropriate';

UPDATE public.reports
SET reason = 'other'
WHERE reason NOT IN (
  'spam',
  'scam',
  'academic_misconduct',
  'harassment',
  'hate_speech',
  'sexual_content',
  'false_information',
  'privacy',
  'other'
);

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reason_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reason_check CHECK (
    reason IN (
      'spam',
      'scam',
      'academic_misconduct',
      'harassment',
      'hate_speech',
      'sexual_content',
      'false_information',
      'privacy',
      'other'
    )
  );

CREATE INDEX IF NOT EXISTS reports_created_at_idx
  ON public.reports (created_at DESC);

-- 管理员删除内容后，批量将相关 pending/reviewed 举报标记为 resolved
CREATE OR REPLACE FUNCTION public.resolve_reports_for_target(
  p_target_type public.target_type,
  p_target_id UUID,
  p_admin_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.reports
  SET
    status = 'resolved',
    resolved_by = p_admin_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE target_type = p_target_type
    AND target_id = p_target_id
    AND status IN ('pending', 'reviewing', 'reviewed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.resolve_reports_for_target(public.target_type, UUID, UUID)
  TO authenticated, service_role;
