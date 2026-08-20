"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ThumbsUp } from "lucide-react";
import {
  toggleReactionAction,
  type InteractionActionState,
} from "@/lib/interaction/actions";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { cn } from "@/lib/utils/cn";

type ContentLikeButtonProps = {
  postId: string;
  likeCount: number;
  isLiked: boolean;
  isLoggedIn: boolean;
  canLike: boolean;
  revalidatePath: string;
};

const initialState: InteractionActionState = {};

export function ContentLikeButton({
  postId,
  likeCount,
  isLiked,
  isLoggedIn,
  canLike,
  revalidatePath,
}: ContentLikeButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleReactionAction,
    initialState,
  );

  if (!isLoggedIn) {
    return (
      <div className="space-y-1">
        <Button type="button" variant="outline" className="gap-1.5" asChild>
          <Link href={ROUTES.login}>
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            {likeCount > 0 ? `${likeCount} 赞` : "赞"}
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">登录后即可点赞</p>
      </div>
    );
  }

  if (!canLike) {
    return (
      <Button type="button" variant="outline" disabled className="gap-1.5">
        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        {likeCount > 0 ? `${likeCount} 赞` : "赞"}
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="targetType" value={TARGET_TYPES.post} />
      <input type="hidden" name="targetId" value={postId} />
      <input type="hidden" name="type" value="like" />
      <input type="hidden" name="revalidatePath" value={revalidatePath} />
      <Button
        type="submit"
        variant={isLiked ? "default" : "outline"}
        disabled={pending}
        className={cn("gap-1.5", isLiked && "bg-primary")}
      >
        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        {likeCount > 0 ? `${likeCount} 赞` : "赞"}
      </Button>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
