"use client";

import { useActionState, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  saveAnnouncementAction,
} from "@/lib/announcements/actions";
import {
  announcementToFormValues,
  createEmptyAnnouncementFormValues,
  type AnnouncementFormValues,
} from "@/lib/announcements/form";
import type { AnnouncementFormState } from "@/lib/announcements/actionTypes";
import {
  adminActionInitialState,
  type AdminActionState,
} from "@/lib/admin/state";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_CATEGORY_IDS,
  ANNOUNCEMENT_DEFAULT_DURATION_HOURS,
  ANNOUNCEMENT_IMPORTANCE,
  ANNOUNCEMENT_IMPORTANCE_IDS,
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_STATUS_LABELS,
} from "@/constants/announcements";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { EmptyState } from "@/components/common/EmptyState";
import { TagBadge } from "@/components/common/TagBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils/formatDate";
import {
  formControlHasError,
  formFieldClassName,
} from "@/lib/utils/formFields";
import { cn } from "@/lib/utils/cn";
import { type AdminAnnouncement } from "@/types/announcement";
import { DateTimePickerField } from "@/components/admin/announcements/DateTimePickerField";
import {
  deleteAnnouncementAction,
  hideAnnouncementAction,
} from "@/lib/announcements/actions";

type AnnouncementPanelProps = {
  announcements: AdminAnnouncement[];
};

const formInitialState: AnnouncementFormState = {};

const textareaClassName =
  "flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.error) {
    return <p className="text-sm text-destructive">{state.error}</p>;
  }
  if (state.success) {
    return <p className="text-sm text-green-600">{state.success}</p>;
  }
  return null;
}

function getStatusLabel(announcement: AdminAnnouncement) {
  if (announcement.status === ANNOUNCEMENT_STATUS.scheduled) {
    return ANNOUNCEMENT_STATUS_LABELS.scheduled;
  }
  if (announcement.status === CONTENT_STATUS.published) {
    return ANNOUNCEMENT_STATUS_LABELS.published;
  }
  if (announcement.status === CONTENT_STATUS.hidden) {
    return ANNOUNCEMENT_STATUS_LABELS.hidden;
  }
  return announcement.status;
}

function getStatusClassName(announcement: AdminAnnouncement) {
  if (announcement.status === ANNOUNCEMENT_STATUS.scheduled) {
    return "bg-sky-100 text-sky-900";
  }
  if (announcement.status === CONTENT_STATUS.hidden) {
    return "bg-amber-100 text-amber-900";
  }
  if (announcement.status === CONTENT_STATUS.published) {
    return "bg-emerald-100 text-emerald-900";
  }
  return undefined;
}

export function AnnouncementPanel({ announcements }: AnnouncementPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);

  function openCreateDialog() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEditDialog(announcement: AdminAnnouncement) {
    setEditing(announcement);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">站点公告</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            填写公告内容后直接发布或预发布；未延迟发布时展示开始时间为提交时刻。
          </p>
        </div>
        <Button type="button" onClick={openCreateDialog}>
          新建公告
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="暂无公告"
          description="创建并发布后，将在首页搜索框下方展示给所有访客。"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[1120px] text-left text-xs">
            <thead className="border-b bg-muted/40">
              <tr className="whitespace-nowrap">
                <th className="px-3 py-2.5 font-medium">标题</th>
                <th className="px-3 py-2.5 font-medium">类型</th>
                <th className="px-3 py-2.5 font-medium">重要等级</th>
                <th className="px-3 py-2.5 font-medium">状态</th>
                <th className="px-3 py-2.5 font-medium">置顶</th>
                <th className="px-3 py-2.5 font-medium">预发布/发布时间</th>
                <th className="px-3 py-2.5 font-medium">展示时段</th>
                <th className="px-3 py-2.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => (
                <AnnouncementRow
                  key={announcement.id}
                  announcement={announcement}
                  onEdit={() => openEditDialog(announcement)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnnouncementFormDialog
        open={dialogOpen}
        editing={editing}
        onClose={closeDialog}
      />
    </section>
  );
}

function AnnouncementFormDialog({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: AdminAnnouncement | null;
  onClose: () => void;
}) {
  const [values, setValues] = useState<AnnouncementFormValues>(
    createEmptyAnnouncementFormValues(),
  );
  const [formState, formAction, formPending] = useActionState(
    saveAnnouncementAction,
    formInitialState,
  );

  const fieldErrors = formState.fieldErrors;
  const isPublishedEdit = Boolean(values.publishedEditMode);

  useEffect(() => {
    if (open) {
      setValues(
        editing
          ? announcementToFormValues(editing)
          : createEmptyAnnouncementFormValues(),
      );
    }
  }, [open, editing]);

  useEffect(() => {
    if (formState.values) {
      setValues(formState.values);
    }
  }, [formState.values]);

  useEffect(() => {
    if (formState.success) {
      onClose();
    }
  }, [formState.success, onClose]);

  function updateValues(patch: Partial<AnnouncementFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  const selectClassName = (field: keyof AnnouncementFormValues) =>
    formFieldClassName(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
      formControlHasError(fieldErrors, field),
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isPublishedEdit ? "编辑已发布公告" : editing ? "编辑公告" : "新建公告"}
          </DialogTitle>
          <DialogDescription>
            {isPublishedEdit
              ? "已发布的公告仅可延长展示结束时间或调整重要等级，内容不可修改。"
              : "填写完整内容后点击发布；如需定时上线，勾选延迟发布并设置预发布时间。"}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {values.announcementId ? (
            <input
              type="hidden"
              name="announcementId"
              value={values.announcementId}
            />
          ) : null}
          {isPublishedEdit ? (
            <input type="hidden" name="publishedEditMode" value="true" />
          ) : null}
          {!isPublishedEdit && values.isPinned ? (
            <input type="hidden" name="isPinned" value="true" />
          ) : null}
          {!isPublishedEdit && values.scheduleDelay ? (
            <input type="hidden" name="scheduleDelay" value="true" />
          ) : null}
          {isPublishedEdit ? (
            <>
              <input type="hidden" name="title" value={values.title} />
              <input type="hidden" name="body" value={values.body} />
              <input type="hidden" name="category" value={values.category} />
              <input type="hidden" name="linkUrl" value={values.linkUrl} />
              <input type="hidden" name="linkLabel" value={values.linkLabel} />
            </>
          ) : null}

          {isPublishedEdit ? (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">标题</p>
                <p className="font-medium">{values.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">正文</p>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {values.body}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">通知类型</p>
                  <p>{ANNOUNCEMENT_CATEGORIES[values.category]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">置顶</p>
                  <p>{values.isPinned ? "是" : "否"}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="announcement-title">标题</Label>
                <Input
                  id="announcement-title"
                  name="title"
                  value={values.title}
                  onChange={(event) => updateValues({ title: event.target.value })}
                  placeholder="例如：PolyUHub 内测志愿者招募"
                  className={
                    formControlHasError(fieldErrors, "title")
                      ? "border-destructive focus-visible:ring-destructive"
                      : undefined
                  }
                  aria-invalid={formControlHasError(fieldErrors, "title")}
                />
                {fieldErrors?.title ? (
                  <p className="text-xs text-destructive">{fieldErrors.title}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="announcement-body">正文</Label>
                <textarea
                  id="announcement-body"
                  name="body"
                  rows={4}
                  value={values.body}
                  onChange={(event) => updateValues({ body: event.target.value })}
                  placeholder="简要说明通知内容，建议控制在 500 字以内"
                  className={formFieldClassName(textareaClassName, formControlHasError(fieldErrors, "body"))}
                  aria-invalid={formControlHasError(fieldErrors, "body")}
                />
                {fieldErrors?.body ? (
                  <p className="text-xs text-destructive">{fieldErrors.body}</p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="announcement-category">通知类型</Label>
                  <select
                    id="announcement-category"
                    name="category"
                    value={values.category}
                    onChange={(event) =>
                      updateValues({
                        category: event.target.value as AnnouncementFormValues["category"],
                      })
                    }
                    className={selectClassName("category")}
                  >
                    {ANNOUNCEMENT_CATEGORY_IDS.map((id) => (
                      <option key={id} value={id}>
                        {ANNOUNCEMENT_CATEGORIES[id]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="announcement-importance">重要等级</Label>
                  <select
                    id="announcement-importance"
                    name="importance"
                    value={values.importance}
                    onChange={(event) =>
                      updateValues({
                        importance: event.target.value as AnnouncementFormValues["importance"],
                      })
                    }
                    className={selectClassName("importance")}
                  >
                    {ANNOUNCEMENT_IMPORTANCE_IDS.map((id) => (
                      <option key={id} value={id}>
                        {ANNOUNCEMENT_IMPORTANCE[id]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="announcement-link-url">详情链接（可选）</Label>
                  <Input
                    id="announcement-link-url"
                    name="linkUrl"
                    value={values.linkUrl}
                    onChange={(event) => updateValues({ linkUrl: event.target.value })}
                    placeholder="https://... 或 /forum"
                    className={
                      formControlHasError(fieldErrors, "linkUrl")
                        ? "border-destructive focus-visible:ring-destructive"
                        : undefined
                    }
                    aria-invalid={formControlHasError(fieldErrors, "linkUrl")}
                  />
                  {fieldErrors?.linkUrl ? (
                    <p className="text-xs text-destructive">{fieldErrors.linkUrl}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="announcement-link-label">链接文案（可选）</Label>
                  <Input
                    id="announcement-link-label"
                    name="linkLabel"
                    value={values.linkLabel}
                    onChange={(event) => updateValues({ linkLabel: event.target.value })}
                    placeholder="查看详情"
                  />
                </div>
              </div>
            </>
          )}

          {isPublishedEdit ? (
            <div className="space-y-1.5">
              <Label htmlFor="announcement-importance">重要等级</Label>
              <select
                id="announcement-importance"
                name="importance"
                value={values.importance}
                onChange={(event) =>
                  updateValues({
                    importance: event.target.value as AnnouncementFormValues["importance"],
                  })
                }
                className={selectClassName("importance")}
              >
                {ANNOUNCEMENT_IMPORTANCE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {ANNOUNCEMENT_IMPORTANCE[id]}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <DateTimePickerField
            name="endsAt"
            label="展示结束时间（可选）"
            value={values.endsAt || null}
            onChange={(isoValue) => updateValues({ endsAt: isoValue })}
            error={fieldErrors?.endsAt}
            placeholder="点击选择展示结束时间"
          />
          <p className="text-[11px] text-muted-foreground">
            {isPublishedEdit
              ? "只能延长结束时间，不能缩短"
              : `不填写则默认从${values.scheduleDelay ? "预发布" : "发布"}时刻起展示 ${ANNOUNCEMENT_DEFAULT_DURATION_HOURS} 小时`}
          </p>

          {!isPublishedEdit ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.isPinned}
                  onChange={(event) => updateValues({ isPinned: event.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                置顶展示（优先出现在首页公告栏）
              </label>

              <div
                className={cn(
                  "space-y-3 rounded-lg border bg-muted/20 p-3",
                  formControlHasError(fieldErrors, "publishedAt") && "border-destructive",
                )}
              >
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={values.scheduleDelay}
                    onChange={(event) =>
                      updateValues({ scheduleDelay: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  是否需要延迟发布？
                </label>

                {values.scheduleDelay ? (
                  <>
                    <DateTimePickerField
                      name="publishedAt"
                      label="预发布时间"
                      value={values.publishedAt || null}
                      onChange={(isoValue) => updateValues({ publishedAt: isoValue })}
                      required
                      error={fieldErrors?.publishedAt}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      须晚于当前时间，到点后系统自动发布；展示开始时间将与预发布时间一致
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    未勾选时将立即发布，展示开始时间为提交时刻
                  </p>
                )}
              </div>
            </>
          ) : null}

          {formState.error ? (
            <p className="text-sm text-destructive">{formState.error}</p>
          ) : null}
          {Object.keys(fieldErrors ?? {}).length > 0 ? (
            <p className="text-sm text-destructive">请修正标红字段后重新提交</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={formPending}>
              {formPending
                ? "提交中..."
                : isPublishedEdit
                  ? "保存"
                  : values.scheduleDelay
                    ? "预发布"
                    : "发布"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementRow({
  announcement,
  onEdit,
}: {
  announcement: AdminAnnouncement;
  onEdit: () => void;
}) {
  const [hideState, hideAction, hidePending] = useActionState(
    hideAnnouncementAction,
    adminActionInitialState,
  );

  const isPublished = announcement.status === CONTENT_STATUS.published;
  const isScheduled = announcement.status === ANNOUNCEMENT_STATUS.scheduled;

  return (
    <tr className="border-b last:border-0">
      <td className="max-w-[280px] px-3 py-2.5">
        <p className="truncate font-medium" title={announcement.title}>
          {announcement.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-muted-foreground" title={announcement.body}>
          {announcement.body}
        </p>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5">
        {ANNOUNCEMENT_CATEGORIES[announcement.category]}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5">
        <span
          className={
            announcement.importance === "important"
              ? "font-medium text-destructive"
              : undefined
          }
        >
          {ANNOUNCEMENT_IMPORTANCE[announcement.importance]}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5">
        <TagBadge
          label={getStatusLabel(announcement)}
          className={getStatusClassName(announcement)}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5">
        {announcement.isPinned ? "是" : "—"}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        {announcement.publishedAt ? formatDateTime(announcement.publishedAt) : "—"}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-[11px] leading-relaxed">
        {announcement.startsAt ? formatDateTime(announcement.startsAt) : "—"}
        <br />
        至 {announcement.endsAt ? formatDateTime(announcement.endsAt) : "—"}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5">
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-nowrap items-center justify-end gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              编辑
            </Button>
            {isPublished ? (
              <form action={hideAction}>
                <input type="hidden" name="announcementId" value={announcement.id} />
                <Button type="submit" size="sm" variant="secondary" disabled={hidePending}>
                  隐藏
                </Button>
              </form>
            ) : null}
            {isScheduled ? (
              <TagBadge label="排队中" className="bg-sky-50 text-sky-800" />
            ) : null}
            <AdminConfirmButton
              label="删除"
              confirmTitle="删除公告"
              confirmDescription="确定删除这条公告吗？删除后首页将不再展示。"
              action={deleteAnnouncementAction}
              hiddenFields={{ announcementId: announcement.id }}
              variant="destructive"
            />
          </div>
          <ActionMessage state={hideState} />
        </div>
      </td>
    </tr>
  );
}
