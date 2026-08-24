import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { PagePagination } from "@/components/common/PagePagination";
import { TagBadge } from "@/components/common/TagBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MARKET_CATEGORIES,
  MARKET_LISTING_STATUSES,
  MARKET_SORT_OPTIONS,
  formatMarketPrice,
  getMarketCategoryLabel,
  getMarketConditionLabel,
  getMarketListingStatusLabel,
  isMarketListingSold,
  type MarketCategoryId,
  type MarketListingStatusId,
  type MarketSortId,
} from "@/constants/marketOptions";
import { ROUTES } from "@/constants/routes";
import { type PaginatedResult } from "@/types/common";
import { type MarketListingWithAuthor } from "@/types/market";
import { cn } from "@/lib/utils/cn";
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";
import { formatRelativeTime } from "@/lib/utils/formatDate";

type MarketListProps = {
  result: PaginatedResult<MarketListingWithAuthor>;
  category?: MarketCategoryId;
  listingStatus?: MarketListingStatusId;
  sort?: MarketSortId;
  search?: string;
  canPublish: boolean;
  publishPrompt?: { href: string; label: string } | null;
};

function buildListHref(params: {
  category?: string;
  listingStatus?: string;
  sort?: string;
  search?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.listingStatus) searchParams.set("status", params.listingStatus);
  if (params.sort && params.sort !== "latest") {
    searchParams.set("sort", params.sort);
  }
  if (params.search) searchParams.set("q", params.search);
  if (params.page && params.page > 1) {
    searchParams.set("page", String(params.page));
  }
  const query = searchParams.toString();
  return query ? `${ROUTES.market.list}?${query}` : ROUTES.market.list;
}

export function MarketList({
  result,
  category,
  listingStatus,
  sort = "latest",
  search,
  canPublish,
  publishPrompt = null,
}: MarketListProps) {
  return (
    <div className="space-y-6">
      <form className="flex flex-1 flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={search ?? ""}
          placeholder="搜索标题或描述"
          className="h-10 min-w-[180px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {MARKET_SORT_OPTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {listingStatus ? (
          <input type="hidden" name="status" value={listingStatus} />
        ) : null}
        <Button type="submit" variant="secondary">
          查询
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">分类</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildListHref({ listingStatus, sort, search })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              !category ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            全部
          </Link>
          {MARKET_CATEGORIES.map((item) => (
            <Link
              key={item.id}
              href={buildListHref({
                category: item.id,
                listingStatus,
                sort,
                search,
              })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                category === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">状态</p>
        <div className="flex flex-wrap gap-2">
          {MARKET_LISTING_STATUSES.map((item) => (
            <Link
              key={item.id}
              href={buildListHref({
                category,
                listingStatus: item.id,
                sort,
                search,
              })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm",
                listingStatus === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="暂无闲置"
          action={
            <Button asChild>
              <Link
                href={
                  canPublish
                    ? ROUTES.market.new
                    : (publishPrompt?.href ?? ROUTES.login)
                }
              >
                {canPublish
                  ? "发布闲置"
                  : (publishPrompt?.label ?? "登录后发布")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((listing) => {
            const cover = listing.imageUrls[0] ?? null;
            const soldOut = isMarketListingSold(listing.listingStatus);

            return (
              <Link
                key={listing.id}
                href={ROUTES.market.detail(listing.id)}
                className="group block h-full"
              >
                <Card
                  className={interactiveCardClassName(
                    cn("h-full overflow-hidden", soldOut && "opacity-70"),
                  )}
                >
                  <div className="aspect-[4/3] bg-muted">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        暂无图片
                      </div>
                    )}
                  </div>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <TagBadge
                        label={getMarketListingStatusLabel(listing.listingStatus)}
                      />
                      <TagBadge label={getMarketCategoryLabel(listing.category)} />
                    </div>
                    <CardTitle className="line-clamp-2 text-base transition-colors group-hover:text-primary">
                      {listing.title}
                    </CardTitle>
                    <CardDescription>
                      {formatMarketPrice(listing.priceHkd)}
                      {listing.priceNegotiable ? " · 可议" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-muted-foreground">
                    <p>{getMarketConditionLabel(listing.condition)}</p>
                    <p>{formatRelativeTime(listing.createdAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <PagePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath={ROUTES.market.list}
        query={{
          q: search,
          category,
          status: listingStatus,
          sort: sort !== "latest" ? sort : undefined,
        }}
      />
    </div>
  );
}
