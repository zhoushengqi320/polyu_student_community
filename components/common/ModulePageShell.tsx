import { type ReactNode } from "react";
import { EmptyState } from "@/components/common/EmptyState";

type ModulePageShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function ModulePageShell({
  title,
  description,
  actions,
  children,
}: ModulePageShellProps) {
  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        </div>
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
