"use client";

import { MessageSquareWarning } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  approveMessageAppealAction,
  rejectMessageAppealAction,
} from "@/lib/admin/actions";
import { ARCHIVE_APPEAL_STATUS_LABELS } from "@/constants/moderation";
import { ROUTES } from "@/constants/routes";
import { formatMessageBodyForReport } from "@/lib/messages/formatMessageReport";
import { getMessageSenderLabel } from "@/lib/messages/formatMessageQuote";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type MessageAppealListItem } from "@/types/message";
import { TagBadge } from "@/components/common/TagBadge";
import Link from "next/link";

type MessageAppealsTableProps = {
  appeals: MessageAppealListItem[];
};

function AppealActionForm({
  messageId,
  action,
  label,
  variant = "outline",
  confirmTitle,
  confirmDescription,
}: {
  messageId: string;
  action: typeof approveMessageAppealAction | typeof rejectMessageAppealAction;
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
      hiddenFields={{ messageId }}
      variant={variant}
      requireReason
      reasonLabel="审核理由"
      reasonPlaceholder="说明通过或驳回申诉的依据（必填，将写入操作记录）"
    />
  );
}

export function MessageAppealsTable({ appeals }: MessageAppealsTableProps) {
  if (appeals.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold">私信违规申诉</h2>
        <TagBadge
          label={`${appeals.length} 条待审`}
          className="bg-amber-100 text-amber-800"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        用户对被判定违规的私信提交申诉。通过将恢复消息显示；驳回则继续隐藏。
      </p>
      <div className="space-y-3">
        {appeals.map((appeal) => {
          const senderName = getMessageSenderLabel(appeal);
          const preview = formatMessageBodyForReport(appeal);

          return (
            <div
              key={appeal.id}
              className="space-y-3 rounded-lg border px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">发送者：{senderName}</p>
                  <p className="text-xs text-muted-foreground">
                    会话{" "}
                    <Link
                      href={ROUTES.messages.conversation(appeal.conversationId)}
                      className="text-primary hover:underline"
                    >
                      {appeal.conversationId.slice(0, 8)}…
                    </Link>
                    · 申诉于{" "}
                    {appeal.appealSubmittedAt
                      ? formatDateTime(appeal.appealSubmittedAt)
                      : "—"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <TagBadge
                      label={
                        ARCHIVE_APPEAL_STATUS_LABELS[appeal.appealStatus] ??
                        appeal.appealStatus
                      }
                    />
                  </div>
                  <div className="mt-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">原消息内容</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">
                      {preview}
                    </p>
                  </div>
                  {appeal.appealNote ? (
                    <p className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                      申诉理由：{appeal.appealNote}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AppealActionForm
                    messageId={appeal.id}
                    action={approveMessageAppealAction}
                    label="通过申诉"
                    variant="default"
                    confirmTitle="通过私信申诉？"
                    confirmDescription="将恢复该私信显示，并标记相关举报为已处理。"
                  />
                  <AppealActionForm
                    messageId={appeal.id}
                    action={rejectMessageAppealAction}
                    label="驳回申诉"
                    variant="destructive"
                    confirmTitle="驳回私信申诉？"
                    confirmDescription="该私信将继续隐藏，并通知发送者申诉未通过。"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
