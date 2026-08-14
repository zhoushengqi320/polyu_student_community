"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { FORUM_MAX_TOPICS } from "@/constants/forum";
import { ROUTES } from "@/constants/routes";
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from "@/components/common/UnsavedChangesGuard";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import {
  createForumPostAction,
  updateForumPostAction,
  type ForumPostFormState,
} from "@/lib/forum/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { CommunityRulesNotice } from "@/components/legal/CommunityRulesNotice";
import { useCtrlSSave } from "@/hooks/useCtrlSSave";
import { showSaveSuccessToast } from "@/lib/utils/saveSuccessToast";

const initialState: ForumPostFormState = {};
const DRAFT_STORAGE_KEY = "polyuhub:forum-post-draft:v1";

type ForumPostFormProps = {
  mode?: "create" | "edit";
  postId?: string;
  popularTopics?: string[];
  initialValues?: {
    title: string;
    content: string;
    topics: string[];
    isAnonymous: boolean;
  };
};

type DraftPayload = {
  title: string;
  content: string;
  topics: string[];
  isAnonymous: boolean;
};

function readCreateDraft(): DraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (
      typeof parsed?.title !== "string" ||
      typeof parsed?.content !== "string" ||
      !Array.isArray(parsed?.topics)
    ) {
      return null;
    }
    return {
      title: parsed.title,
      content: parsed.content,
      topics: parsed.topics.filter((item): item is string => typeof item === "string"),
      isAnonymous: Boolean(parsed.isAnonymous),
    };
  } catch {
    return null;
  }
}

export function ForumPostForm({
  mode = "create",
  postId,
  popularTopics = [],
  initialValues,
}: ForumPostFormProps) {
  const router = useRouter();
  const action =
    mode === "edit" && postId
      ? updateForumPostAction.bind(null, postId)
      : createForumPostAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [topics, setTopics] = useState<string[]>(initialValues?.topics ?? []);
  const [topicInput, setTopicInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(
    initialValues?.isAnonymous ?? false,
  );
  const { markDirty, markClean, confirmLeave, dialogProps } = useUnsavedChangesGuard();
  const formRef = useRef<HTMLFormElement>(null);
  const canShowSaveToastRef = useRef(false);
  const draftHydratedRef = useRef(false);
  const [draftReady, setDraftReady] = useState(mode !== "create");

  const handleCtrlSSave = useCallback(() => {
    if (pending) return;
    formRef.current?.requestSubmit();
  }, [pending]);

  useCtrlSSave({
    enabled: mode === "edit",
    disabled: pending,
    onSave: handleCtrlSSave,
  });

  useEffect(() => {
    if (mode !== "create" || draftHydratedRef.current) return;
    draftHydratedRef.current = true;
    const draft = readCreateDraft();
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
      setTopics(draft.topics);
      setIsAnonymous(draft.isAnonymous);
    }
    setDraftReady(true);
  }, [mode]);

  useEffect(() => {
    if (mode !== "create" || !draftReady) return;
    // 提交中先清草稿：成功 redirect 后不会再写回；失败时下面的 state 仍在，会重新落盘
    if (pending) {
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }
    const payload: DraftPayload = { title, content, topics, isAnonymous };
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }, [mode, draftReady, pending, title, content, topics, isAnonymous]);

  useEffect(() => {
    if (state.pendingReview || (state.success && mode === "create")) {
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      if (state.pendingReview) {
        router.push(ROUTES.forum.list);
      }
    }
  }, [state.pendingReview, state.success, mode, router]);

  useEffect(() => {
    if (pending) {
      canShowSaveToastRef.current = true;
    }
  }, [pending]);

  useEffect(() => {
    if (pending || !state.success || !canShowSaveToastRef.current) {
      return;
    }
    canShowSaveToastRef.current = false;
    markClean();
    showSaveSuccessToast();
  }, [pending, state.success, markClean]);

  function addTopic(raw: string) {
    const value = raw.trim();
    if (!value) {
      return;
    }
    if (value.length > 30) {
      return;
    }
    if (topics.includes(value)) {
      setTopicInput("");
      return;
    }
    if (topics.length >= FORUM_MAX_TOPICS) {
      return;
    }
    markDirty();
    setTopics((current) => [...current, value]);
    setTopicInput("");
  }

  function removeTopic(topic: string) {
    markDirty();
    setTopics((current) => current.filter((item) => item !== topic));
  }

  return (
    <>
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{mode === "edit" ? "编辑帖子" : "发布帖子"}</CardTitle>
          <CardDescription>
            分享课程求助、考试复习、实习 RA、校园生活；找学习搭子、约饭、组队或室友请加上「找搭子」话题
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  markDirty();
                }}
                placeholder="输入帖子标题（5–120 字）"
                maxLength={120}
                required
              />
              {state.fieldErrors?.title ? (
                <p className="text-sm text-destructive">{state.fieldErrors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <textarea
                id="content"
                name="content"
                rows={8}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  markDirty();
                }}
                placeholder="写下你想分享的内容（10–5000 字）…找搭子可写清时间、地点、人数与联系方式"
                required
                className="flex min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {state.fieldErrors?.content ? (
                <p className="text-sm text-destructive">{state.fieldErrors.content}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="topicInput">
                话题（最多 {FORUM_MAX_TOPICS} 个，每个最多 30 字）
              </Label>
              <div className="flex gap-2">
                <Input
                  id="topicInput"
                  value={topicInput}
                  onChange={(event) => setTopicInput(event.target.value)}
                  placeholder="输入话题后按添加"
                  maxLength={30}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTopic(topicInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addTopic(topicInput)}
                  disabled={topics.length >= FORUM_MAX_TOPICS}
                >
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(popularTopics.length > 0 ? popularTopics : []).slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addTopic(suggestion)}
                    disabled={topics.includes(suggestion) || topics.length >= FORUM_MAX_TOPICS}
                    className={cn(
                      "rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50",
                    )}
                  >
                    #{suggestion}
                  </button>
                ))}
                {popularTopics.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    暂无热门话题，可在上方自行添加（最多 5 个）
                  </p>
                ) : null}
              </div>
              {topics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => removeTopic(topic)}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      #{topic} ×
                    </button>
                  ))}
                </div>
              ) : null}
              <input type="hidden" name="topics" value={topics.join(",")} />
              {state.fieldErrors?.topics ? (
                <p className="text-sm text-destructive">{state.fieldErrors.topics}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isAnonymous"
                name="isAnonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) => {
                  setIsAnonymous(event.target.checked);
                  markDirty();
                }}
                value="on"
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isAnonymous" className="font-normal">
                匿名发帖（其他用户将看到「匿名用户」）
              </Label>
            </div>

            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}

            {state.success ? (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {state.success}
              </p>
            ) : null}

            <CommunityRulesNotice />

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={pending}>
                {pending
                  ? mode === "edit"
                    ? "保存中..."
                    : "发布中..."
                  : mode === "edit"
                    ? "保存修改"
                    : "发布帖子"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  confirmLeave(() => {
                    router.push(
                      mode === "edit" && postId
                        ? ROUTES.forum.detail(postId)
                        : ROUTES.forum.list,
                    );
                  })
                }
              >
                {mode === "edit" ? "取消" : "返回讨论区"}
              </Button>
              {mode === "edit" ? (
                <span className="text-xs text-muted-foreground">
                  快捷键 Ctrl/⌘+S 保存（不离开编辑页）
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <PendingOverlay
        active={pending}
        label={mode === "edit" ? "保存中…" : "发布中…"}
      />
      <UnsavedChangesDialog {...dialogProps} />
    </>
  );
}
