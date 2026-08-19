import { type ReactNode } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageBackLink } from "@/components/common/PageBackLink";

type ModulePageShellProps = {
  title: string;
  /** @deprecated 不再展示标题下灰色说明，保留参数仅为兼容旧调用 */
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  /** 非首页：返回上一级 */
  back?: { href: string; label: string };
};

export function ModulePageShell({
  title,
  actions,
  children,
  back,
}: ModulePageShellProps) {
  return (
    <div className="container py-8">
      {back ? <PageBackLink href={back.href} label={back.label} /> : null}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {actions}
      </div>
      {children ?? (
        <EmptyState
          title="暂无内容"
          description="数据库接入后将在此展示内容，当前为模块占位页。"
        />
      )}
    </div>
  );
}
