"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from "@/components/common/UnsavedChangesGuard";
import { ContentArticleForm } from "@/components/admin/content/ContentArticleForm";
import { ContentArticleTable } from "@/components/admin/content/ContentArticleTable";
import { GuideEditor } from "@/components/admin/guides/GuideEditor";
import { GuideManagementTable } from "@/components/admin/guides/GuideManagementTable";
import { cn } from "@/lib/utils/cn";
import {
  type AdminContentArticle,
  type ContentCmsModule,
} from "@/lib/db/contentCms";
import { type AdminGuideDetail } from "@/types/guide";

type ContentCmsPanelProps = {
  guides: AdminGuideDetail[];
  studyArticles: AdminContentArticle[];
  lifeArticles: AdminContentArticle[];
};

type CmsSection = "guides" | "study" | "life";
type CmsView = "list" | "create" | "edit";

const SECTIONS: { id: CmsSection; label: string }[] = [
  { id: "guides", label: "入学攻略" },
  { id: "study", label: "学习指南" },
  { id: "life", label: "生活指南" },
];

export function ContentCmsPanel({
  guides,
  studyArticles,
  lifeArticles,
}: ContentCmsPanelProps) {
  const [section, setSection] = useState<CmsSection>("guides");
  const [view, setView] = useState<CmsView>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const { setIsDirty, confirmLeave, dialogProps } = useUnsavedChangesGuard({
    enableBeforeUnload: false,
  });

  useEffect(() => {
    setIsDirty(formDirty);
  }, [formDirty, setIsDirty]);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setFormDirty(dirty);
  }, []);

  function resetToList() {
    setView("list");
    setEditingId(null);
    setFormDirty(false);
  }

  function switchSection(next: CmsSection) {
    confirmLeave(() => {
      setSection(next);
      resetToList();
    });
  }

  const editingGuide =
    section === "guides" && editingId
      ? (guides.find((item) => item.id === editingId) ?? null)
      : null;

  const moduleArticles =
    section === "study" ? studyArticles : section === "life" ? lifeArticles : [];
  const editingArticle =
    (section === "study" || section === "life") && editingId
      ? (moduleArticles.find((item) => item.id === editingId) ?? null)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchSection(item.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              section === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "guides" ? (
        view === "create" ? (
          <GuideEditor
            mode="create"
            onCancel={resetToList}
            onSuccess={resetToList}
            onDirtyChange={handleDirtyChange}
          />
        ) : view === "edit" ? (
          editingGuide ? (
            <GuideEditor
              mode="edit"
              guide={editingGuide}
              onCancel={resetToList}
              onSuccess={resetToList}
              onDirtyChange={handleDirtyChange}
            />
          ) : (
            <p className="text-sm text-muted-foreground">未找到攻略</p>
          )
        ) : (
          <GuideManagementTable
            guides={guides}
            onCreate={() => setView("create")}
            onEdit={(guideId) => {
              setEditingId(guideId);
              setView("edit");
            }}
          />
        )
      ) : view === "create" || view === "edit" ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {view === "create"
                ? `创建${section === "study" ? "学习" : "生活"}指南`
                : `编辑${section === "study" ? "学习" : "生活"}指南`}
            </CardTitle>
            <CardDescription>
              {view === "create"
                ? "新建内容会先保存为草稿，发布前不会出现在前台。"
                : "保存修改不会自动改变发布状态，请在列表中使用发布 / 隐藏。"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view === "edit" && !editingArticle ? (
              <p className="text-sm text-muted-foreground">未找到文章</p>
            ) : (
              <ContentArticleForm
                module={section as ContentCmsModule}
                mode={view === "create" ? "create" : "edit"}
                initialValues={editingArticle}
                onCancel={resetToList}
                onSuccess={resetToList}
                onDirtyChange={handleDirtyChange}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <ContentArticleTable
          module={section as ContentCmsModule}
          articles={moduleArticles}
          onCreate={() => setView("create")}
          onEdit={(articleId) => {
            setEditingId(articleId);
            setView("edit");
          }}
        />
      )}

      <UnsavedChangesDialog {...dialogProps} />
    </div>
  );
}
