"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuideForm } from "@/components/admin/guides/GuideForm";
import { type AdminGuideDetail } from "@/types/guide";

type GuideEditorProps = {
  mode: "create" | "edit";
  guide?: AdminGuideDetail | null;
  onCancel: () => void;
  onSuccess: (guideId?: string) => void;
};

export function GuideEditor({ mode, guide, onCancel, onSuccess }: GuideEditorProps) {
  const initialValues =
    mode === "edit" && guide
      ? {
          guideId: guide.id,
          title: guide.title,
          excerpt: guide.excerpt,
          content: guide.content,
          category: guide.meta?.category ?? guide.categoryId,
          targetAudience: guide.meta?.targetAudience ?? null,
          estimatedReadingTime: guide.meta?.estimatedReadingTime ?? null,
          sourceLinks: guide.meta?.sourceLinks ?? [],
        }
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "创建攻略" : "编辑攻略"}</CardTitle>
        <CardDescription>
          {mode === "create"
            ? "新建内容会先保存为草稿，发布前不会出现在前台 /guides。"
            : "保存修改不会自动改变发布状态，请在列表中使用发布 / 隐藏按钮。"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GuideForm
          mode={mode}
          initialValues={initialValues}
          onCancel={onCancel}
          onSuccess={onSuccess}
        />
      </CardContent>
    </Card>
  );
}
