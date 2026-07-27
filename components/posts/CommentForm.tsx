"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { createCommentAction, type CommentFormState } from "@/lib/forum/actions";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CommentFormProps = {
  postId: string;
  canComment: boolean;
  isLoggedIn: boolean;
  revalidatePath?: string;
};

const initialState: CommentFormState = {};

export function CommentForm({
  postId,
  canComment,
  isLoggedIn,
  revalidatePath,
}: CommentFormProps) {
  const boundAction = createCommentAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error, state.fieldErrors]);

  if (!isLoggedIn) {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
          登录
        </Link>{" "}
        后即可评论
      </p>
    );
  }

  if (!canComment) {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        当前账号无法评论
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {revalidatePath ? (
        <input type="hidden" name="revalidatePath" value={revalidatePath} />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="content">发表评论</Label>
        <textarea
          id="content"
          name="content"
          rows={4}
          placeholder="写下你的评论..."
          required
          className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.fieldErrors?.content ? (
          <p className="text-sm text-destructive">{state.fieldErrors.content}</p>
        ) : null}
      </div>

      {state.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "发送中..." : "发送评论"}
      </Button>
    </form>
  );
}
