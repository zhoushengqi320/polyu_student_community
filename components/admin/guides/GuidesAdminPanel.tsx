"use client";

import { useState } from "react";
import { GuideEditor } from "@/components/admin/guides/GuideEditor";
import { GuideManagementTable } from "@/components/admin/guides/GuideManagementTable";
import { type AdminGuideDetail } from "@/types/guide";

type GuidesAdminPanelProps = {
  guides: AdminGuideDetail[];
};

type GuidesAdminView = "list" | "create" | "edit";

export function GuidesAdminPanel({ guides }: GuidesAdminPanelProps) {
  const [view, setView] = useState<GuidesAdminView>("list");
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);

  const editingGuide =
    editingGuideId != null
      ? guides.find((guide) => guide.id === editingGuideId) ?? null
      : null;

  function handleBackToList() {
    setView("list");
    setEditingGuideId(null);
  }

  if (view === "create") {
    return (
      <GuideEditor
        mode="create"
        onCancel={handleBackToList}
        onSuccess={handleBackToList}
      />
    );
  }

  if (view === "edit") {
    if (!editingGuide) {
      return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          未找到要编辑的攻略，请返回列表重试。
          <div className="mt-4">
            <button
              type="button"
              className="text-primary underline"
              onClick={handleBackToList}
            >
              返回列表
            </button>
          </div>
        </div>
      );
    }

    return (
      <GuideEditor
        mode="edit"
        guide={editingGuide}
        onCancel={handleBackToList}
        onSuccess={handleBackToList}
      />
    );
  }

  return (
    <GuideManagementTable
      guides={guides}
      onCreate={() => setView("create")}
      onEdit={(guideId) => {
        setEditingGuideId(guideId);
        setView("edit");
      }}
    />
  );
}
