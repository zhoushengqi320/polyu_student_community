"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { toggleReactionAction, type InteractionActionState } from "@/lib/interaction/actions";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type CommentLikeButtonProps = {
  commentId: string;
  likeCount: number;
  isLiked: boolean;
  canInteract: boolean;
  revalidatePath: string;
};

const initialState: InteractionActionState = {};

export function CommentLikeButton({
  commentId,
  likeCount,
  isLiked,
  canInteract,
  revalidatePath,
}: CommentLikeButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleReactionAction,
    initialState,
  );

  if (!canInteract) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
        {likeCount}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <form action={formAction} className="inline-flex">
        <input type="hidden" name="targetType" value="comment" />
        <input type="hidden" name="targetId" value={commentId} />
        <input type="hidden" name="type" value="like" />
        <input type="hidden" name="revalidatePath" value={revalidatePath} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          className={cn(
            "h-8 gap-1 px-2 text-xs",
            isLiked && "text-primary",
          )}
        >
          <ThumbsUp
            className={cn("h-3.5 w-3.5", isLiked && "fill-current")}
            aria-hidden="true"
          />
          {likeCount > 0 ? likeCount : "赞"}
        </Button>
      </form>
      {state.error ? (
        <span className="text-xs text-destructive">{state.error}</span>
      ) : null}
    </div>
  );
}

type CommentReplyTriggerProps = {
  canComment: boolean;
  isLoggedIn: boolean;
  onClick: () => void;
};

export function CommentReplyTrigger({
  canComment,
  isLoggedIn,
  onClick,
}: CommentReplyTriggerProps) {
  if (canComment) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={onClick}
      >
        回复
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        asChild
      >
        <Link href={ROUTES.login}>登录后回复</Link>
      </Button>
    );
  }

  return null;
}
