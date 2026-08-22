import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { PagePagination } from "@/components/common/PagePagination";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FOOD_AREAS, type FoodAreaId } from "@/constants/categories";
import { getFoodCategoryLabel } from "@/constants/foodCategories";
import { ROUTES } from "@/constants/routes";
import { type FoodPlaceWithStats } from "@/types/food";
import { type PaginatedResult } from "@/types/common";
import { cn } from "@/lib/utils/cn";
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";

type FoodListProps = {
  result: PaginatedResult<FoodPlaceWithStats>;
  area?: FoodAreaId;
  search?: string;
  canSubmit: boolean;
  submitPrompt?: { href: string; label: string } | null;
};

function areaLabel(area: string) {
  return FOOD_AREAS.find((item) => item.id === area)?.label ?? area;
}

export function FoodList({
  result,
  area,
  search,
  canSubmit,
  submitPrompt = null,
}: FoodListProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-1 flex-wrap gap-2" method="get">
          <input
            name="q"
            defaultValue={search ?? ""}
            placeholder="搜索店名或地址"
            className="h-10 min-w-[180px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
          />
          {area ? <input type="hidden" name="area" value={area} /> : null}
          <Button type="submit" variant="secondary">
            查询
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={ROUTES.food.list}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm",
            !area ? "bg-primary text-primary-foreground" : "bg-secondary",
          )}
        >
          全部
        </Link>
        {FOOD_AREAS.map((item) => (
          <Link
            key={item.id}
            href={`${ROUTES.food.list}?area=${item.id}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              area === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="暂无地点"
          description="还没有收录吃喝玩乐地点，欢迎成为第一个提交的人。"
          action={
            <Button asChild>
              <Link
                href={
                  canSubmit
                    ? ROUTES.food.new
                    : (submitPrompt?.href ?? ROUTES.login)
                }
              >
                {canSubmit ? "提交地点" : (submitPrompt?.label ?? "登录后提交")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {result.data.map((place) => (
            <Card key={place.id} className={interactiveCardClassName()}>
              <Link href={ROUTES.food.detail(place.id)} className="group block">
                <CardHeader>
                  <CardTitle className="text-lg">{place.name}</CardTitle>
                  <CardDescription>
                    {getFoodCategoryLabel(place.category)} · {areaLabel(place.area)}
                    {place.address ? ` · ${place.address}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">评分</p>
                    <RatingDisplay value={place.averageRating} size="sm" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">推荐数</p>
                    <p className="font-medium">{place.recommendationCount}</p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <PagePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath={ROUTES.food.list}
        query={{
          q: search,
          area,
        }}
      />
    </div>
  );
}
