"use client";

import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

type RichTextEditorProps = {
  name: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  onSaveShortcut?: () => void;
};

/** 避免 TipTap 在 SSR/首屏水合阶段报错，仅在浏览器挂载后加载 */
const RichTextEditorClient = dynamic(
  () =>
    import("./RichTextEditorClient").then((mod) => mod.RichTextEditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[360px] animate-pulse rounded-lg border border-input bg-muted/30 p-4 text-sm text-muted-foreground">
        正在加载可视化编辑器…
      </div>
    ),
  },
);

export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <div className={cn("space-y-2", props.className)}>
      <Label>{props.label ?? "正文"}</Label>
      <RichTextEditorClient {...props} />
      {props.hint ? (
        <p className="text-xs text-muted-foreground">{props.hint}</p>
      ) : null}
      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}
