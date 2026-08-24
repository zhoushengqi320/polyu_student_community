import { type ReactNode } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageBackLink } from "@/components/common/PageBackLink";
import { cn } from "@/lib/utils/cn";

type ModulePageShellProps = {
  title: string;
  /** @deprecated 不再展示标题下灰色说明，保留参数仅为兼容旧调用 */
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  /** 非首页：返回上一级 */
  back?: { href: string; label: string };
  /** 隐藏页面大标题（如私信全屏布局） */
  hideTitle?: boolean;
  /** 紧凑布局：减少上下留白，子内容区可 flex 撑满 */
  compact?: boolean;
  /** 紧凑模式下横向撑满（私信等全宽页面） */
  fullWidth?: boolean;
};

export function ModulePageShell({
  title,
  actions,
  children,
  back,
  hideTitle = false,
  compact = false,
  fullWidth = false,
}: ModulePageShellProps) {
  return (
    <div
      className={cn(
        compact
          ? cn(
              "flex min-h-0 flex-1 flex-col pt-3 pb-5",
              fullWidth
                ? "w-full max-w-none px-3 sm:px-5 lg:px-8"
                : "container",
            )
          : "container py-8",
      )}
    >
      {back ? (
        <PageBackLink
          href={back.href}
          label={back.label}
          className={compact ? "mb-2 shrink-0" : undefined}
        />
      ) : null}
      {!hideTitle ? (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {actions}
        </div>
      ) : actions ? (
        <div className="mb-2 flex shrink-0 justify-end">{actions}</div>
      ) : null}
      <div className={cn(compact && "flex min-h-0 flex-1 flex-col")}>
        {children ?? (
          <EmptyState
            title="暂无内容"
            description="数据库接入后将在此展示内容，当前为模块占位页。"
          />
        )}
      </div>
    </div>
  );
}
