"use client";

import { useActionState } from "react";
import {
  createFeedbackReplyAction,
  type FeedbackReplyState,
} from "@/lib/feedback/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: FeedbackReplyState = {};

export function FeedbackAdminReplyForm({ postId }: { postId: string }) {
  const action = createFeedbackReplyAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border p-4">
      <Label htmlFor={`feedback-reply-${postId}`}>管理员回复</Label>
      <textarea
        id={`feedback-reply-${postId}`}
        name="content"
        rows={4}
        required
        placeholder="回复用户的问题…"
        className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {state.fieldErrors?.content ? (
        <p className="text-sm text-destructive">{state.fieldErrors.content}</p>
      ) : null}
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "发送中..." : "发送回复"}
      </Button>
    </form>
  );
}
