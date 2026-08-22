import { cn } from "@/lib/utils/cn";

/** 管理后台表格通用样式：单行展示，过长内容截断，横向滚动 */
export const ADMIN_TABLE = {
  wrap: "overflow-x-auto rounded-xl border",
  headCell: "px-4 py-3 font-medium whitespace-nowrap",
  headCellCompact: "px-3 py-2.5 font-medium whitespace-nowrap",
  row: "border-b last:border-0 whitespace-nowrap",
  cell: "px-4 py-3 whitespace-nowrap align-middle",
  cellCompact: "px-3 py-2.5 whitespace-nowrap align-middle",
  cellRight: "px-4 py-3 whitespace-nowrap align-middle text-right",
  actions: "flex flex-nowrap items-center justify-end gap-1.5",
} as const;

export function adminTruncateCell(
  maxWidthClass: string,
  compact = false,
): string {
  return cn(
    compact ? ADMIN_TABLE.cellCompact : ADMIN_TABLE.cell,
    maxWidthClass,
    "truncate",
  );
}
