"use client";

import { useState } from "react";
import { Archive } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  approveArchiveAppealAction,
  rejectArchiveAppealAction,
} from "@/lib/admin/actions";
import {
  ARCHIVE_APPEAL_STATUS_LABELS,
  type ArchiveAppealStatus,
} from "@/constants/moderation";
import { TARGET_TYPE_LABELS } from "@/constants/admin";
import { type TargetType } from "@/constants/reportReasons";
import { type ContentArchiveRow } from "@/lib/db/contentArchives";
import { formatDateTime } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ContentArchivePanelProps = {
  archives: ContentArchiveRow[];
  pendingAppeals: ContentArchiveRow[];
  expiredCount?: number;
};

function AppealActionForm({
  archiveId,
  action,
  label,
  variant = "outline",
  confirmTitle,
  confirmDescription,
}: {
  archiveId: string;
  action: typeof approveArchiveAppealAction | typeof rejectArchiveAppealAction;
  label: string;
  variant?: "default" | "outline" | "destructive";
  confirmTitle: string;
  confirmDescription: string;
}) {
  return (
    <AdminConfirmButton
      label={label}
      confirmTitle={confirmTitle}
      confirmDescription={confirmDescription}
      action={action}
      hiddenFields={{ archiveId }}
      variant={variant}
      requireReason
      reasonLabel="审核理由"
      reasonPlaceholder="说明通过或驳回申诉的依据（必填，将写入操作记录）"
    />
  );
}

function SnapshotPreview({ archive }: { archive: ContentArchiveRow }) {
  const [open, setOpen] = useState(false);
  const content =
    (archive.snapshot?.content as string | null | undefined) ??
    JSON.stringify(archive.snapshot, null, 2);

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        查看快照
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{archive.title ?? "封存内容快照"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              {TARGET_TYPE_LABELS[archive.target_type as TargetType] ??
                archive.target_type}{" "}
              · {archive.target_id}
            </p>
            <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
              {content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ArchiveRow({
  archive,
  showAppealActions = false,
}: {
  archive: ContentArchiveRow;
  showAppealActions?: boolean;
}) {
  const typeLabel =
    TARGET_TYPE_LABELS[archive.target_type as TargetType] ??
    archive.target_type;
  const appealStatus = archive.appeal_status as ArchiveAppealStatus;

  return (
    <div className="space-y-3 rounded-lg border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{archive.title ?? "（无标题）"}</p>
          <p className="text-xs text-muted-foreground">
            {typeLabel} · 封存于 {formatDateTime(archive.archived_at)} · 申诉截止{" "}
            {formatDateTime(archive.appeal_deadline)}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <TagBadge label={ARCHIVE_APPEAL_STATUS_LABELS[appealStatus]} />
            {archive.snapshot?.owner_id ? (
              <TagBadge
                label={`作者 ${(archive.snapshot.owner_id as string).slice(0, 8)}…`}
              />
            ) : null}
          </div>
          {archive.appeal_note ? (
            <p className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
              申诉理由：{archive.appeal_note}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SnapshotPreview archive={archive} />
          {showAppealActions ? (
            <>
              <AppealActionForm
                archiveId={archive.id}
                action={approveArchiveAppealAction}
                label="通过申诉"
                variant="default"
                confirmTitle="通过申诉？"
                confirmDescription="将恢复内容公开并删除封存记录，通知作者。"
              />
              <AppealActionForm
                archiveId={archive.id}
                action={rejectArchiveAppealAction}
                label="驳回申诉"
                variant="destructive"
                confirmTitle="驳回申诉？"
                confirmDescription="内容保持下架，通知作者申诉未通过。"
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ContentArchivePanel({
  archives,
  pendingAppeals,
  expiredCount = 0,
}: ContentArchivePanelProps) {
  return (
    <div className="space-y-8">
      {expiredCount > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          本次加载已自动处理 {expiredCount} 条逾期封存（原文软删除，完整备份写入操作记录）。
        </p>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">待审申诉</h2>
          <p className="text-sm text-muted-foreground">
            作者提交申诉后不会自动恢复，需管理员通过或驳回。
          </p>
        </div>
        {pendingAppeals.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            暂无待审申诉。
          </p>
        ) : (
          <div className="space-y-3">
            {pendingAppeals.map((archive) => (
              <ArchiveRow
                key={archive.id}
                archive={archive}
                showAppealActions
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">活跃封存库</h2>
          <p className="text-sm text-muted-foreground">
            30 天申诉期内的隐藏内容副本；逾期后会永久软删并移出本列表。
          </p>
        </div>
        {archives.length === 0 ? (
          <EmptyState
            icon={Archive}
            title="暂无封存内容"
            description="二次举报自动隐藏或管理员确认违规后，内容快照会复制到此处。"
          />
        ) : (
          <div className="space-y-3">
            {archives.map((archive) => (
              <ArchiveRow key={archive.id} archive={archive} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
