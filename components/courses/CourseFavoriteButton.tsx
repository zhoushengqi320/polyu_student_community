"use client";

import { useActionState } from "react";
import { Bookmark } from "lucide-react";
import {
  toggleReactionAction,
  type InteractionActionState,
} from "@/lib/interaction/actions";
import { Button } from "@/components/ui/button";
import { TARGET_TYPES } from "@/constants/reportReasons";

type CourseFavoriteButtonProps = {
  courseId: string;
  isFavorited: boolean;
  revalidatePath: string;
};

const initialState: InteractionActionState = {};

export function CourseFavoriteButton({
  courseId,
  isFavorited,
  revalidatePath,
}: CourseFavoriteButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleReactionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="targetType" value={TARGET_TYPES.course} />
      <input type="hidden" name="targetId" value={courseId} />
      <input type="hidden" name="type" value="favorite" />
      <input type="hidden" name="revalidatePath" value={revalidatePath} />
      <Button
        type="submit"
        variant={isFavorited ? "default" : "outline"}
        disabled={pending}
        className="w-full md:w-auto"
      >
        <Bookmark className="h-4 w-4" aria-hidden="true" />
        {isFavorited ? "已收藏课程" : "收藏课程"}
      </Button>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
