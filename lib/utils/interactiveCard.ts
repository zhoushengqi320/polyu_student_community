import { cn } from "@/lib/utils/cn";

/**
 * 可点击卡片的悬停 / 按下反馈（参考常见列表卡片：悬停抬升阴影，按下轻微缩放并收回阴影）。
 * - 直接点在 Card 上：用 active:*
 * - 外层 Link.group 包裹：用 group-active:*
 * - 内部有子链接被按下：用 has-[:active]:*
 */
export function interactiveCardClassName(...extra: Array<string | undefined>) {
  return cn(
    "origin-center transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out",
    "hover:shadow-md",
    "active:scale-[0.985] active:shadow-none active:bg-muted/50 active:border-primary/20",
    "group-active:scale-[0.985] group-active:shadow-none group-active:bg-muted/50 group-active:border-primary/20",
    "has-[:active]:scale-[0.985] has-[:active]:shadow-none has-[:active]:bg-muted/50 has-[:active]:border-primary/20",
    ...extra,
  );
}
