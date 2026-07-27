"use client";

import { useActionState } from "react";
import {
  deleteCommentAction,
  type InteractionActionState,
} from "@/lib/interaction/actions";
import { Button } from "@/components/ui/button";

type DeleteCommentButtonProps = {
  commentId: string;
  revalidatePath: string;
  label?: string;
};

const initialState: InteractionActionState = {};

export function DeleteCommentButton({
  commentId,
  revalidatePath,
  label = "删除",
}: DeleteCommentButtonProps) {
  const [state, formAction, pending] = useActionState(
    deleteCommentAction,
    initialState,
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-end">
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="revalidatePath" value={revalidatePath} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-destructive hover:text-destructive"
        disabled={pending}
      >
        {pending ? "删除中..." : label}
      </Button>
      {state.error ? (
        <span className="text-xs text-destructive">{state.error}</span>
      ) : null}
    </form>
  );
}
