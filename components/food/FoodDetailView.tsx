import { DeleteContentButton } from "@/components/common/DeleteContentButton";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import { UserIdentity } from "@/components/common/UserIdentity";
import { FoodFavoriteButton } from "@/components/food/FoodFavoriteButton";
import { FoodRecommendSection } from "@/components/food/FoodRecommendSection";
import { ReportDialog } from "@/components/common/ReportDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FOOD_AREAS } from "@/constants/categories";
import { getFoodCategoryLabel } from "@/constants/foodCategories";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { deleteOwnFoodRecommendationAction } from "@/lib/food/actions";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { Highlightable } from "@/components/common/Highlightable";
import { contentHighlightId } from "@/constants/contentHighlight";
import { type FoodPlaceDetail } from "@/types/food";

type FoodDetailViewProps = {
  place: FoodPlaceDetail;
  canRecommend: boolean;
  canFavorite: boolean;
  isLoggedIn: boolean;
  isFavorited: boolean;
  favoriteCount: number;
  currentUserId: string | null;
};

function areaLabel(area: string) {
  return FOOD_AREAS.find((item) => item.id === area)?.label ?? area;
}

export function FoodDetailView({
  place,
  canRecommend,
  canFavorite,
  isLoggedIn,
  isFavorited,
  favoriteCount,
  currentUserId,
}: FoodDetailViewProps) {
  const detailPath = ROUTES.food.detail(place.id);

  return (
    <div className="space-y-6">
      <Highlightable id={contentHighlightId("place", place.id)}>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{place.name}</CardTitle>
              <CardDescription>
                {getFoodCategoryLabel(place.category)} · {areaLabel(place.area)}
                {place.address ? ` · ${place.address}` : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <FoodFavoriteButton
                placeId={place.id}
                isFavorited={isFavorited}
                favoriteCount={favoriteCount}
                isLoggedIn={isLoggedIn}
                canFavorite={canFavorite}
                revalidatePath={detailPath}
              />
              <ReportDialog
                targetType={TARGET_TYPES.food_place}
                targetId={place.id}
                isLoggedIn={isLoggedIn}
                revalidatePath={detailPath}
                triggerLabel="举报地点"
                triggerVariant="outline"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">平均评分</p>
            <RatingDisplay value={place.averageRating} />
          </div>
          <div>
            <p className="text-muted-foreground">推荐数</p>
            <p className="text-lg font-semibold">{place.recommendationCount}</p>
          </div>
          {place.tags.length > 0 ? (
            <div className="w-full">
              <p className="text-muted-foreground">标签</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {place.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      </Highlightable>

      <FoodRecommendSection placeId={place.id} canRecommend={canRecommend} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">同学推荐</h2>
        {place.recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无推荐，来写第一条吧。</p>
        ) : (
          place.recommendations.map((item) => (
            <Highlightable key={item.id} id={contentHighlightId("rec", item.id)}>
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <UserIdentity
                      userId={item.author.id}
                      name={item.author.displayName ?? item.author.username}
                      avatarUrl={item.author.avatarUrl}
                      role={item.author.role}
                      size="sm"
                    />
                    <CardDescription>
                      {formatRelativeTime(item.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentUserId === item.userId ? (
                      <DeleteContentButton
                        action={deleteOwnFoodRecommendationAction.bind(
                          null,
                          item.id,
                          place.id,
                        )}
                        title="确认删除推荐？"
                        description="删除后将不再公开展示。"
                      />
                    ) : null}
                    <ReportDialog
                      targetType={TARGET_TYPES.food_recommendation}
                      targetId={item.id}
                      isLoggedIn={isLoggedIn}
                      ownerId={item.userId}
                      currentUserId={currentUserId}
                      revalidatePath={detailPath}
                      triggerSize="sm"
                    />
                  </div>
                </div>
                <RatingDisplay value={item.rating} size="sm" />
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
              </CardContent>
            </Card>
            </Highlightable>
          ))
        )}
      </section>
    </div>
  );
}
