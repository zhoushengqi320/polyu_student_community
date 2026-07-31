import Link from "next/link";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { FOOD_AREAS } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import {
  type FavoriteCourseItem,
  type FavoriteFoodPlaceItem,
  type UserFavorites,
} from "@/lib/db/favorites";

type ProfileFavoritesSectionProps = {
  favorites: UserFavorites;
};

function areaLabel(area: string) {
  return FOOD_AREAS.find((item) => item.id === area)?.label ?? area;
}

function FavoriteCourseRow({ item }: { item: FavoriteCourseItem }) {
  return (
    <Link
      href={ROUTES.courses.detail(item.course.code)}
      className="block rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium">
            {item.course.code} · {item.course.name}
          </p>
          <p className="text-xs text-muted-foreground">{item.course.department}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(item.favoritedAt)}
        </p>
      </div>
    </Link>
  );
}

function FavoriteFoodRow({ item }: { item: FavoriteFoodPlaceItem }) {
  return (
    <Link
      href={ROUTES.food.detail(item.place.id)}
      className="block rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium">{item.place.name}</p>
          <p className="text-xs text-muted-foreground">
            {areaLabel(item.place.area)}
            {item.place.address ? ` · ${item.place.address}` : ""}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(item.favoritedAt)}
        </p>
      </div>
    </Link>
  );
}

export function ProfileFavoritesSection({
  favorites,
}: ProfileFavoritesSectionProps) {
  const isEmpty =
    favorites.courses.length === 0 && favorites.foodPlaces.length === 0;

  return (
    <section id="favorites" className="max-w-2xl space-y-4 scroll-mt-24">
      <div>
        <h2 className="text-lg font-semibold">我的收藏</h2>
        <p className="text-sm text-muted-foreground">
          仅自己可见。可从课程详情、吃喝玩乐地点页添加收藏。
        </p>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Bookmark}
          title="还没有收藏"
          description="去课程评价或吃喝玩乐逛逛，点收藏后会显示在这里。"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={ROUTES.courses.list}
                className="text-sm font-medium text-primary hover:underline"
              >
                浏览课程
              </Link>
              <span className="text-sm text-muted-foreground">·</span>
              <Link
                href={ROUTES.food.list}
                className="text-sm font-medium text-primary hover:underline"
              >
                吃喝玩乐
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              课程（{favorites.courses.length}）
            </h3>
            {favorites.courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无收藏课程</p>
            ) : (
              <div className="space-y-2">
                {favorites.courses.map((item) => (
                  <FavoriteCourseRow key={item.course.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              吃喝玩乐（{favorites.foodPlaces.length}）
            </h3>
            {favorites.foodPlaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无收藏地点</p>
            ) : (
              <div className="space-y-2">
                {favorites.foodPlaces.map((item) => (
                  <FavoriteFoodRow key={item.place.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
