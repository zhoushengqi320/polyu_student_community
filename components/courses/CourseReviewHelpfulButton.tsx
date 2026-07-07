"use client";

import { useActionState } from "react";
import { ThumbsUp } from "lucide-react";
import {
  toggleReactionAction,
  type InteractionActionState,
} from "@/lib/interaction/actions";
import { Button } from "@/components/ui/button";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { cn } from "@/lib/utils/cn";

type CourseReviewHelpfulButtonProps = {
  reviewId: string;
  usefulCount: number;
  isMarkedUseful: boolean;
  revalidatePath: string;
};

const initialState: InteractionActionState = {};

export function CourseReviewHelpfulButton({
  reviewId,
  usefulCount,
  isMarkedUseful,
  revalidatePath,
}: CourseReviewHelpfulButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleReactionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="targetType" value={TARGET_TYPES.course_review} />
      <input type="hidden" name="targetId" value={reviewId} />
      <input type="hidden" name="type" value="like" />
      <input type="hidden" name="revalidatePath" value={revalidatePath} />
      <Button
        type="submit"
        variant={isMarkedUseful ? "default" : "outline"}
        size="sm"
        disabled={pending}
        className={cn("gap-1.5", isMarkedUseful && "bg-primary")}
      >
        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        有用 {usefulCount}
      </Button>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
