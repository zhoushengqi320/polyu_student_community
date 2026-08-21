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

type GuideFavoriteButtonProps = {
  guideId: string;
  isFavorited: boolean;
  favoriteCount: number;
  isLoggedIn: boolean;
  canFavorite: boolean;
  revalidatePath: string;
};

const initialState: InteractionActionState = {};

export function GuideFavoriteButton({
  guideId,
  isFavorited,
  favoriteCount,
  isLoggedIn,
  canFavorite,
  revalidatePath,
}: GuideFavoriteButtonProps) {
  const [state, formAction, pending] = useActionState(
    toggleReactionAction,
    initialState,
  );

  if (!isLoggedIn) {
    return (
      <div className="space-y-1">
        <Button type="button" variant="outline" disabled className="gap-1.5">
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          收藏 {favoriteCount > 0 ? favoriteCount : ""}
        </Button>
        <p className="text-xs text-muted-foreground">
          <Link href={ROUTES.login} className="font-medium text-primary hover:underline">
            登录
          </Link>{" "}
          后即可收藏
        </p>
      </div>
    );
  }

  if (!canFavorite) {
    return (
      <Button type="button" variant="outline" disabled className="gap-1.5">
        <Bookmark className="h-4 w-4" aria-hidden="true" />
        收藏 {favoriteCount > 0 ? favoriteCount : ""}
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="targetType" value={TARGET_TYPES.post} />
      <input type="hidden" name="targetId" value={guideId} />
      <input type="hidden" name="type" value="favorite" />
      <input type="hidden" name="revalidatePath" value={revalidatePath} />
      <Button
        type="submit"
        variant={isFavorited ? "default" : "outline"}
        disabled={pending}
        className="gap-1.5"
      >
        <Bookmark className="h-4 w-4" aria-hidden="true" />
        {isFavorited ? "已收藏" : "收藏"}
        {favoriteCount > 0 ? ` ${favoriteCount}` : ""}
      </Button>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
