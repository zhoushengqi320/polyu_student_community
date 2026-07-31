"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import { GUIDE_CATEGORIES } from "@/constants/guides";
import {
  createGuideAction,
  updateGuideAction,
  type GuideFormState,
} from "@/lib/guides/actions";
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from "@/components/common/UnsavedChangesGuard";
import { RichTextEditor } from "@/components/admin/content/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type GuideSourceLink } from "@/types/guide";

type GuideFormProps = {
  mode: "create" | "edit";
  initialValues?: {
    guideId?: string;
    title?: string;
    excerpt?: string | null;
    content?: string;
    category?: string | null;
    targetAudience?: string | null;
    estimatedReadingTime?: number | null;
    sourceLinks?: GuideSourceLink[];
  };
  onCancel: () => void;
  onSuccess?: (guideId?: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const initialState: GuideFormState = {};

const textareaClassName =
  "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function emptySourceLink(): GuideSourceLink {
  return { label: "", url: "" };
}

export function GuideForm({
  mode,
  initialValues,
  onCancel,
  onSuccess,
  onDirtyChange,
}: GuideFormProps) {
  const action = mode === "create" ? createGuideAction : updateGuideAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [sourceLinks, setSourceLinks] = useState<GuideSourceLink[]>(
    initialValues?.sourceLinks?.length
      ? initialValues.sourceLinks
      : [emptySourceLink()],
  );
  const { isDirty, markDirty, markClean, confirmLeave, dialogProps } =
    useUnsavedChangesGuard();
  const skipEditorDirtyRef = useRef(true);

  const sourceLinksJson = useMemo(
    () =>
      JSON.stringify(
        sourceLinks.filter((item) => item.label.trim() && item.url.trim()),
      ),
    [sourceLinks],
  );

  const handledSuccessRef = useRef<string | null>(null);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!state.success || !onSuccess) {
      if (!state.success) {
        handledSuccessRef.current = null;
      }
      return;
    }

    const successKey = `${state.success}:${state.guideId ?? initialValues?.guideId ?? ""}`;
    if (handledSuccessRef.current === successKey) {
      return;
    }

    handledSuccessRef.current = successKey;
    markClean();
    onSuccess(state.guideId ?? initialValues?.guideId);
  }, [state.success, state.guideId, initialValues?.guideId, onSuccess, markClean]);

  return (
    <>
    <form
      action={formAction}
      className="space-y-5"
      onChange={markDirty}
    >
      {mode === "edit" && initialValues?.guideId ? (
        <input type="hidden" name="guideId" value={initialValues.guideId} />
      ) : null}
      <input type="hidden" name="sourceLinks" value={sourceLinksJson} />

      <div className="space-y-2">
        <Label htmlFor="guide-title">标题</Label>
        <Input
          id="guide-title"
          name="title"
          defaultValue={initialValues?.title ?? ""}
          placeholder="例如：PolyU 申请材料清单"
          required
        />
        {state.fieldErrors?.title ? (
          <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="guide-excerpt">摘要</Label>
        <textarea
          id="guide-excerpt"
          name="excerpt"
          defaultValue={initialValues?.excerpt ?? ""}
          placeholder="用于列表页展示的简短说明"
          className={textareaClassName}
          rows={3}
        />
        {state.fieldErrors?.excerpt ? (
          <p className="text-sm text-destructive">{state.fieldErrors.excerpt}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="guide-category">分类</Label>
          <select
            id="guide-category"
            name="category"
            defaultValue={initialValues?.category ?? ""}
            required
            className={selectClassName}
          >
            <option value="" disabled>
              请选择分类
            </option>
            {GUIDE_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.category ? (
            <p className="text-sm text-destructive">{state.fieldErrors.category}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="guide-reading-time">预计阅读时长（分钟，可选）</Label>
          <Input
            id="guide-reading-time"
            name="estimatedReadingTime"
            type="number"
            min={1}
            max={120}
            defaultValue={initialValues?.estimatedReadingTime ?? ""}
            placeholder="例如：5"
          />
          {state.fieldErrors?.estimatedReadingTime ? (
            <p className="text-sm text-destructive">
              {state.fieldErrors.estimatedReadingTime}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guide-target-audience">目标读者</Label>
        <Input
          id="guide-target-audience"
          name="targetAudience"
          defaultValue={initialValues?.targetAudience ?? ""}
          placeholder="例如：申请 PolyU 的准新生"
        />
        {state.fieldErrors?.targetAudience ? (
          <p className="text-sm text-destructive">
            {state.fieldErrors.targetAudience}
          </p>
        ) : null}
      </div>

      <RichTextEditor
        key={initialValues?.guideId ?? `create-${mode}`}
        name="content"
        value={content}
        onChange={(value) => {
          setContent(value);
          if (skipEditorDirtyRef.current) {
            skipEditorDirtyRef.current = false;
            return;
          }
          markDirty();
        }}
        required
        error={state.fieldErrors?.content}
        hint="所见即所得：工具栏可调标题、字号、颜色、对齐，并插入图片与表格。"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>参考链接</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              markDirty();
              setSourceLinks((items) => [...items, emptySourceLink()]);
            }}
          >
            添加链接
          </Button>
        </div>

        <div className="space-y-3">
          {sourceLinks.map((item, index) => (
            <div
              key={`source-link-${index}`}
              className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <Input
                value={item.label}
                placeholder="链接名称"
                onChange={(event) => {
                  markDirty();
                  const next = [...sourceLinks];
                  next[index] = { ...next[index], label: event.target.value };
                  setSourceLinks(next);
                }}
              />
              <Input
                value={item.url}
                placeholder="https://"
                onChange={(event) => {
                  markDirty();
                  const next = [...sourceLinks];
                  next[index] = { ...next[index], url: event.target.value };
                  setSourceLinks(next);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sourceLinks.length === 1}
                onClick={() => {
                  markDirty();
                  setSourceLinks((items) =>
                    items.filter((_, itemIndex) => itemIndex !== index),
                  );
                }}
              >
                移除
              </Button>
            </div>
          ))}
        </div>
        {state.fieldErrors?.sourceLinks ? (
          <p className="text-sm text-destructive">{state.fieldErrors.sourceLinks}</p>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-green-600">{state.success}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : mode === "create" ? "创建草稿" : "保存修改"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => confirmLeave(onCancel)}
        >
          返回列表
        </Button>
      </div>
    </form>
    <UnsavedChangesDialog {...dialogProps} />
    </>
  );
}
