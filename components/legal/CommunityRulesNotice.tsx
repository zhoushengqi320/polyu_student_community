"use client";

import { CommunityRulesDialog } from "@/components/legal/CommunityRulesDialog";
import { cn } from "@/lib/utils/cn";

type CommunityRulesNoticeProps = {
  className?: string;
  /** 默认面向发帖/提交场景 */
  message?: string;
};

export function CommunityRulesNotice({
  className,
  message = "发布内容前请遵守社区规则，共同维护校园讨论秩序。",
}: CommunityRulesNoticeProps) {
  return (
    <p className={cn("text-xs leading-5 text-muted-foreground", className)}>
      {message}{" "}
      <CommunityRulesDialog triggerLabel="查看社区规则" />
    </p>
  );
}
