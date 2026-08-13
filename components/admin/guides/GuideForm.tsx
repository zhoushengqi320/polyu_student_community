"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
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
import { useCtrlSSave } from "@/hooks/useCtrlSSave";
import { showSaveSuccessToast } from "@/lib/utils/saveSuccessToast";
import { type GuideSourceLink } from "@/types/guide";

type GuideFormProps = {
  mode: "create" | "edit";
  initialValues?: {
    guideId?: string;
    title?: string;
    excerpt?: string | null;
    content?: string;
    category?: string | null;
    sourceLinks?: GuideSourceLink[];
  };
  onCancel: () => void;
  onSuccess?: (guideId?: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const initialState: GuideFormState = {};

const textareaClassName =
  "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
  const formRef = useRef<HTMLFormElement>(null);
  const saveViaShortcutRef = useRef(false);

  const sourceLinksJson = useMemo(
    () =>
      JSON.stringify(
        sourceLinks.filter((item) => item.label.trim() && item.url.trim()),
      ),
    [sourceLinks],
  );

  const handledSuccessRef = useRef<string | null>(null);

  const handleCtrlSSave = useCallback(() => {
    if (pending) return;
    saveViaShortcutRef.current = true;
    formRef.current?.requestSubmit();
  }, [pending]);

  useCtrlSSave({ disabled: pending, onSave: handleCtrlSSave });

  useEffect(() => {
    if (pending) {
      handledSuccessRef.current = null;
    }
  }, [pending]);

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
    showSaveSuccessToast();

    if (saveViaShortcutRef.current && mode === "edit") {
      saveViaShortcutRef.current = false;
      return;
    }
    saveViaShortcutRef.current = false;
    onSuccess(state.guideId ?? initialValues?.guideId);
  }, [state.success, state.guideId, initialValues?.guideId, onSuccess, markClean, mode]);

  return (
    <>
    <form
      ref={formRef}
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

      <input type="hidden" name="category" value={initialValues?.category ?? "admission"} />

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
        onSaveShortcut={handleCtrlSSave}
        required
        error={state.fieldErrors?.content}
        hint="所见即所得：工具栏可调标题、字号、颜色、对齐，并插入图片与表格。快捷键 ⌘/Ctrl+S 保存。"
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

      <div className="flex flex-wrap items-center gap-3">
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
        <span className="text-xs text-muted-foreground">
          快捷键 Ctrl/⌘+S 保存（不离开编辑页）
        </span>
      </div>
    </form>
    <UnsavedChangesDialog {...dialogProps} />
    </>
  );
}
