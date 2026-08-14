"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Bookmark, ThumbsUp } from "lucide-react";
import { toggleReactionAction, type InteractionActionState } from "@/lib/interaction/actions";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";

type ForumReactionButtonsProps = {
  postId: string;
  likeCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  canInteract: boolean;
  isLoggedIn?: boolean;
  revalidatePath: string;
};

const initialState: InteractionActionState = {};

export function ForumReactionButtons({
  postId,
  likeCount,
  isLiked,
  isFavorited,
  canInteract,
  isLoggedIn = false,
  revalidatePath,
}: ForumReactionButtonsProps) {
  const [state, formAction, pending] = useActionState(toggleReactionAction, initialState);

  if (!canInteract) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {isLoggedIn ? (
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            {likeCount} 赞
          </span>
        ) : (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={ROUTES.login}>
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              {likeCount} 赞
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={formAction}>
          <input type="hidden" name="targetType" value="post" />
          <input type="hidden" name="targetId" value={postId} />
          <input type="hidden" name="type" value="like" />
          <input type="hidden" name="revalidatePath" value={revalidatePath} />
          <Button
            type="submit"
            variant={isLiked ? "default" : "outline"}
            size="sm"
            disabled={pending}
            className={cn("gap-1.5", isLiked && "bg-primary")}
          >
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            {likeCount} 赞
          </Button>
        </form>

        <form action={formAction}>
          <input type="hidden" name="targetType" value="post" />
          <input type="hidden" name="targetId" value={postId} />
          <input type="hidden" name="type" value="favorite" />
          <input type="hidden" name="revalidatePath" value={revalidatePath} />
          <Button
            type="submit"
            variant={isFavorited ? "default" : "outline"}
            size="sm"
            disabled={pending}
            className="gap-1.5"
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            {isFavorited ? "已收藏" : "收藏"}
          </Button>
        </form>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}
