import Link from "next/link";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDepartmentCode } from "@/constants/courseOptions";
import { FOOD_AREAS } from "@/constants/categories";
import {
  formatMarketPrice,
  getMarketListingStatusLabel,
} from "@/constants/marketOptions";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import {
  type FavoriteCourseItem,
  type FavoriteFoodPlaceItem,
  type FavoriteForumPostItem,
  type FavoriteMarketListingItem,
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
          <p className="text-xs text-muted-foreground">
            {getDepartmentCode(item.course.department)}
          </p>
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

function FavoriteForumPostRow({ item }: { item: FavoriteForumPostItem }) {
  return (
    <Link
      href={ROUTES.forum.detail(item.post.id)}
      prefetch={false}
      className="block rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.post.title}</p>
          {item.post.excerpt ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {item.post.excerpt}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {item.post.authorDisplayName}
            {item.post.commentCount > 0
              ? ` · ${item.post.commentCount} 条评论`
              : ""}
            {item.post.topics.length > 0
              ? ` · ${item.post.topics.slice(0, 2).join("、")}`
              : ""}
          </p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(item.favoritedAt)}
        </p>
      </div>
    </Link>
  );
}

function FavoriteMarketRow({ item }: { item: FavoriteMarketListingItem }) {
  return (
    <Link
      href={ROUTES.market.detail(item.listing.id)}
      className="block rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium">{item.listing.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatMarketPrice(item.listing.priceHkd)}
            {" · "}
            {getMarketListingStatusLabel(item.listing.listingStatus)}
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
    favorites.courses.length === 0 &&
    favorites.foodPlaces.length === 0 &&
    favorites.forumPosts.length === 0 &&
    favorites.marketListings.length === 0;

  return (
    <Card id="favorites" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>我的收藏</CardTitle>
        <CardDescription>
          仅自己可见。可从自由讨论区、课程评价、吃喝玩乐、二手市集页面添加收藏。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <EmptyState
            icon={Bookmark}
            title="还没有收藏"
            description="去自由讨论区、课程评价、吃喝玩乐或二手市集逛逛，点收藏后会显示在这里。"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href={ROUTES.forum.list}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  自由讨论区
                </Link>
                <span className="text-sm text-muted-foreground">·</span>
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
                <span className="text-sm text-muted-foreground">·</span>
                <Link
                  href={ROUTES.market.list}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  二手市集
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                自由讨论区（{favorites.forumPosts.length}）
              </h3>
              {favorites.forumPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无收藏帖子</p>
              ) : (
                <div className="space-y-2">
                  {favorites.forumPosts.map((item) => (
                    <FavoriteForumPostRow key={item.post.id} item={item} />
                  ))}
                </div>
              )}
            </div>

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

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                二手市集（{favorites.marketListings.length}）
              </h3>
              {favorites.marketListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无收藏闲置</p>
              ) : (
                <div className="space-y-2">
                  {favorites.marketListings.map((item) => (
                    <FavoriteMarketRow key={item.listing.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
