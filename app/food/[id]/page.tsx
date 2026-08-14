import { notFound } from "next/navigation";
import { FoodDetailView } from "@/components/food/FoodDetailView";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getFoodPlaceById } from "@/lib/db/food";
import { countReactions, hasReaction } from "@/lib/db/reactions";
import { can } from "@/lib/utils/permissions";

type FoodDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  const place = await getFoodPlaceById(id);

  if (!place) {
    notFound();
  }

  const [isFavorited, favoriteCount] = await Promise.all([
    user
      ? hasReaction({
          userId: user.id,
          targetType: TARGET_TYPES.food_place,
          targetId: place.id,
          type: "favorite",
        })
      : Promise.resolve(false),
    countReactions({
      targetType: TARGET_TYPES.food_place,
      targetId: place.id,
      type: "favorite",
    }),
  ]);

  return (
    <ModulePageShell
      title={place.name}
      description="吃喝玩乐 · 地点详情"
      back={{ href: ROUTES.food.list, label: "吃喝玩乐" }}
    >
      <FoodDetailView
        place={place}
        canRecommend={can(user, "content:create:food")}
        canFavorite={can(user, "interaction:favorite")}
        isLoggedIn={Boolean(user)}
        isFavorited={isFavorited}
        favoriteCount={favoriteCount}
        currentUserId={user?.id ?? null}
      />
    </ModulePageShell>
  );
}
