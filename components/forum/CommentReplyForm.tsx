"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCommentAction, type CommentFormState } from "@/lib/forum/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CommentReplyFormProps = {
  postId: string;
  parentCommentId: string;
  replyToName: string;
  canComment: boolean;
  revalidatePath?: string;
  onCancel?: () => void;
};

const initialState: CommentFormState = {};

export function CommentReplyForm({
  postId,
  parentCommentId,
  replyToName,
  canComment,
  revalidatePath,
  onCancel,
}: CommentReplyFormProps) {
  const boundAction = createCommentAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && !state.fieldErrors) {
      formRef.current?.reset();
      setVisible(false);
      onCancel?.();
    }
    wasPending.current = pending;
  }, [pending, state.error, state.fieldErrors, onCancel]);

  if (!canComment) {
    return null;
  }

  if (!visible) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={() => setVisible(true)}
      >
        回复
      </Button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="mt-3 space-y-2 rounded-md border bg-background p-3">
      <input type="hidden" name="parentId" value={parentCommentId} />
      {revalidatePath ? (
        <input type="hidden" name="revalidatePath" value={revalidatePath} />
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor={`reply-${parentCommentId}`} className="text-xs">
          回复 @{replyToName}
        </Label>
        <textarea
          id={`reply-${parentCommentId}`}
          name="content"
          rows={3}
          placeholder="写下你的回复..."
          required
          autoFocus
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.fieldErrors?.content ? (
          <p className="text-xs text-destructive">{state.fieldErrors.content}</p>
        ) : null}
      </div>

      {state.error ? (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "发送中..." : "发送回复"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setVisible(false);
            onCancel?.();
          }}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
