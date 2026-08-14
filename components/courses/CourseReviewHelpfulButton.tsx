"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import {
  toggleReactionAction,
  type InteractionActionState,
} from "@/lib/interaction/actions";
import { Button } from "@/components/ui/button";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";

type CourseReviewHelpfulButtonProps = {
  reviewId: string;
  usefulCount: number;
  isMarkedUseful: boolean;
  revalidatePath: string;
  isLoggedIn?: boolean;
};

const initialState: InteractionActionState = {};

export function CourseReviewHelpfulButton({
  reviewId,
  usefulCount,
  isMarkedUseful,
  revalidatePath,
  isLoggedIn = false,
}: CourseReviewHelpfulButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleReactionAction,
    initialState,
  );

  if (!isLoggedIn) {
    return (
      <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
        <Link href={ROUTES.login}>
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
          有用 {usefulCount}
        </Link>
      </Button>
    );
  }

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
