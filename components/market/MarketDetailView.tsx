"use client";

import Link from "next/link";
import { useActionState } from "react";
import { DeleteContentButton } from "@/components/common/DeleteContentButton";
import { ReportDialog } from "@/components/common/ReportDialog";
import { UserIdentity } from "@/components/common/UserIdentity";
import { MarketFavoriteButton } from "@/components/market/MarketFavoriteButton";
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
  formatMarketPrice,
  getMarketCategoryLabel,
  getMarketConditionLabel,
  getMarketListingStatusLabel,
  getMarketTradeMethodLabel,
  MARKET_LISTING_STATUSES,
} from "@/constants/marketOptions";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import {
  deleteMarketListingAction,
  updateMarketListingStatusAction,
  type MarketFormState,
} from "@/lib/market/actions";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type MarketListingWithAuthor } from "@/types/market";

type MarketDetailViewProps = {
  listing: MarketListingWithAuthor;
  canFavorite: boolean;
  isLoggedIn: boolean;
  isFavorited: boolean;
  favoriteCount: number;
  isOwner: boolean;
  currentUserId: string | null;
};

const statusInitial: MarketFormState = {};

export function MarketDetailView({
  listing,
  canFavorite,
  isLoggedIn,
  isFavorited,
  favoriteCount,
  isOwner,
  currentUserId,
}: MarketDetailViewProps) {
  const detailPath = ROUTES.market.detail(listing.id);
  const [statusState, statusAction, statusPending] = useActionState(
    updateMarketListingStatusAction,
    statusInitial,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <TagBadge
                  label={getMarketListingStatusLabel(listing.listingStatus)}
                />
                <TagBadge label={getMarketCategoryLabel(listing.category)} />
                <TagBadge label={getMarketConditionLabel(listing.condition)} />
              </div>
              <CardTitle className="text-2xl">{listing.title}</CardTitle>
              <CardDescription>
                {formatMarketPrice(listing.priceHkd)}
                {listing.priceNegotiable ? " · 可议" : ""}
                {" · "}
                {formatRelativeTime(listing.createdAt)}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <MarketFavoriteButton
                listingId={listing.id}
                isFavorited={isFavorited}
                favoriteCount={favoriteCount}
                isLoggedIn={isLoggedIn}
                canFavorite={canFavorite}
                revalidatePath={detailPath}
              />
              <ReportDialog
                targetType={TARGET_TYPES.market_listing}
                targetId={listing.id}
                isLoggedIn={isLoggedIn}
                ownerId={listing.userId}
                currentUserId={currentUserId}
                revalidatePath={detailPath}
                triggerLabel="举报闲置"
                triggerVariant="outline"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {listing.imageUrls.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listing.imageUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="aspect-[4/3] w-full rounded-md object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">描述</h2>
            <p className="whitespace-pre-wrap text-sm leading-7">
              {listing.description}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              交易方式
            </h2>
            <div className="flex flex-wrap gap-2">
              {listing.tradeMethods.map((method) => (
                <TagBadge
                  key={method}
                  label={getMarketTradeMethodLabel(method)}
                />
              ))}
            </div>
          </div>

          {listing.contactNote ? (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                联系备注
              </h2>
              <p className="text-sm leading-6">{listing.contactNote}</p>
              <p className="text-xs text-muted-foreground">
                可通过卖家个人主页了解更多；线下交易请自行甄别，平台不担保。
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              可通过卖家个人主页联系；线下交易请自行甄别，平台不担保。
            </p>
          )}

          <div className="border-t pt-4">
            <UserIdentity
              userId={listing.author.id}
              name={listing.author.displayName ?? listing.author.username}
              avatarUrl={listing.author.avatarUrl}
              role={listing.author.role}
            />
          </div>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">管理我的闲置</CardTitle>
            <CardDescription>
              仅本人可编辑、改状态或删除。管理员请到后台处理违规内容。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.market.edit(listing.id)}>编辑</Link>
              </Button>
              <DeleteContentButton
                action={deleteMarketListingAction.bind(null, listing.id)}
                title="确认删除闲置？"
                description="删除后前台将不再展示，此操作不可撤销。"
              />
            </div>

            <form action={statusAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="listingId" value={listing.id} />
              <div className="space-y-1">
                <label
                  htmlFor="listingStatus"
                  className="text-xs text-muted-foreground"
                >
                  在售状态
                </label>
                <select
                  id="listingStatus"
                  name="listingStatus"
                  defaultValue={listing.listingStatus}
                  className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {MARKET_LISTING_STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm" disabled={statusPending}>
                {statusPending ? "更新中..." : "更新状态"}
              </Button>
            </form>
            {statusState.error ? (
              <p className="text-sm text-destructive">{statusState.error}</p>
            ) : null}
            {statusState.success ? (
              <p className="text-sm text-green-600">{statusState.success}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
