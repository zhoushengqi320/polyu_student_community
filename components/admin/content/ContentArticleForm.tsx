"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import {
  LIFE_GUIDE_TOPICS,
  STUDY_GUIDE_TOPICS,
} from "@/constants/categories";
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from "@/components/common/UnsavedChangesGuard";
import { RichTextEditor } from "@/components/admin/content/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createContentArticleAction,
  updateContentArticleAction,
  type ContentArticleFormState,
} from "@/lib/content/cmsActions";
import {
  type AdminContentArticle,
  type ContentCmsModule,
} from "@/lib/db/contentCms";
import { useCtrlSSave } from "@/hooks/useCtrlSSave";
import { showSaveSuccessToast } from "@/lib/utils/saveSuccessToast";

type ContentArticleFormProps = {
  module: ContentCmsModule;
  mode: "create" | "edit";
  initialValues?: AdminContentArticle | null;
  onCancel: () => void;
  onSuccess?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const initialState: ContentArticleFormState = {};

const textareaClassName =
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ContentArticleForm({
  module,
  mode,
  initialValues,
  onCancel,
  onSuccess,
  onDirtyChange,
}: ContentArticleFormProps) {
  const action =
    mode === "create" ? createContentArticleAction : updateContentArticleAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [content, setContent] = useState(initialValues?.content ?? "");
  const handledSuccessRef = useRef<string | null>(null);
  const skipEditorDirtyRef = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);
  const saveViaShortcutRef = useRef(false);
  const { isDirty, markDirty, markClean, confirmLeave, dialogProps } =
    useUnsavedChangesGuard();

  const categoryOptions =
    module === "study"
      ? STUDY_GUIDE_TOPICS.map((item) => item.label)
      : LIFE_GUIDE_TOPICS.map((item) => item.label);

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
      if (!state.success) handledSuccessRef.current = null;
      return;
    }
    const key = `${state.success}:${state.articleId ?? ""}`;
    if (handledSuccessRef.current === key) return;
    handledSuccessRef.current = key;
    markClean();
    showSaveSuccessToast();

    if (saveViaShortcutRef.current && mode === "edit") {
      saveViaShortcutRef.current = false;
      return;
    }
    saveViaShortcutRef.current = false;
    onSuccess();
  }, [state.success, state.articleId, onSuccess, markClean, mode]);

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-5"
        onChange={markDirty}
      >
        <input type="hidden" name="module" value={module} />
        {mode === "edit" && initialValues ? (
          <input type="hidden" name="articleId" value={initialValues.id} />
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="article-title">标题</Label>
          <Input
            id="article-title"
            name="title"
            defaultValue={initialValues?.title ?? ""}
            required
          />
          {state.fieldErrors?.title ? (
            <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-excerpt">摘要</Label>
          <textarea
            id="article-excerpt"
            name="excerpt"
            defaultValue={initialValues?.excerpt ?? ""}
            className={textareaClassName}
            rows={3}
          />
          {state.fieldErrors?.excerpt ? (
            <p className="text-sm text-destructive">{state.fieldErrors.excerpt}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-category">分类</Label>
          <Input
            id="article-category"
            name="category"
            list={`category-options-${module}`}
            defaultValue={initialValues?.categoryId ?? ""}
            placeholder="可从建议中选择，也可自定义"
            required
            className={selectClassName}
          />
          <datalist id={`category-options-${module}`}>
            {categoryOptions.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          {state.fieldErrors?.category ? (
            <p className="text-sm text-destructive">{state.fieldErrors.category}</p>
          ) : null}
        </div>

        <RichTextEditor
          key={initialValues?.id ?? `create-${module}`}
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
