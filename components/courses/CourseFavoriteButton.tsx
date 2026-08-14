"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Bookmark } from "lucide-react";
import {
  toggleReactionAction,
  type InteractionActionState,
} from "@/lib/interaction/actions";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES } from "@/constants/reportReasons";

type CourseFavoriteButtonProps = {
  courseId: string;
  isFavorited: boolean;
  revalidatePath: string;
  isLoggedIn?: boolean;
};

const initialState: InteractionActionState = {};

export function CourseFavoriteButton({
  courseId,
  isFavorited,
  revalidatePath,
  isLoggedIn = false,
}: CourseFavoriteButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleReactionAction,
    initialState,
  );

  if (!isLoggedIn) {
    return (
      <div className="space-y-1">
        <Button type="button" variant="outline" disabled className="w-full gap-1.5 md:w-auto">
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          收藏课程
        </Button>
        <p className="text-xs text-muted-foreground">
          <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
            登录
          </Link>{" "}
          后即可收藏课程
        </p>
      </div>
    );
  }

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
        className="w-full gap-1.5 md:w-auto"
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
