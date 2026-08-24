"use client";

import { ShoppingBag } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  formatMarketPrice,
  getMarketCategoryLabel,
  getMarketListingStatusLabel,
} from "@/constants/marketOptions";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { adminHideMarketListingAction } from "@/lib/admin/actions";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type MarketListingWithAuthor } from "@/types/market";

type MarketListingsTableProps = {
  listings: MarketListingWithAuthor[];
};

export function MarketListingsTable({ listings }: MarketListingsTableProps) {
  if (listings.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="暂无闲置"
        description="二手市集还没有发布内容。"
      />
    );
  }

  return (
    <div className={ADMIN_TABLE.wrap}>
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className={ADMIN_TABLE.headCell}>标题</th>
            <th className={ADMIN_TABLE.headCell}>卖家</th>
            <th className={ADMIN_TABLE.headCell}>价格</th>
            <th className={ADMIN_TABLE.headCell}>分类 / 状态</th>
            <th className={ADMIN_TABLE.headCell}>发布时间</th>
            <th className={`${ADMIN_TABLE.headCell} text-right`}>操作</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => {
            const isHidden = listing.status === CONTENT_STATUS.hidden;

            return (
              <tr key={listing.id} className={ADMIN_TABLE.row}>
                <td className={adminTruncateCell("max-w-[280px]")}>
                  <span
                    className={
                      isHidden ? "text-muted-foreground" : "font-medium"
                    }
                    title={listing.title}
                  >
                    {listing.title}
                    {isHidden ? "（已隐藏）" : ""}
                  </span>
                </td>
                <td className={adminTruncateCell("max-w-[140px]")}>
                  {listing.author.displayName ?? listing.author.username}
                </td>
                <td className={ADMIN_TABLE.cell}>
                  {formatMarketPrice(listing.priceHkd)}
                  {listing.priceNegotiable ? " · 可议" : ""}
                </td>
                <td className={ADMIN_TABLE.cell}>
                  <div className="flex flex-wrap gap-1">
                    <TagBadge label={getMarketCategoryLabel(listing.category)} />
                    <TagBadge
                      label={getMarketListingStatusLabel(listing.listingStatus)}
                    />
                    {isHidden ? (
                      <TagBadge
                        label="Hidden"
                        className="bg-destructive/10 text-destructive"
                      />
                    ) : null}
                  </div>
                </td>
                <td className={`${ADMIN_TABLE.cell} text-muted-foreground`}>
                  {formatDateTime(listing.createdAt)}
                </td>
                <td className={ADMIN_TABLE.cellRight}>
                  {!isHidden ? (
                    <AdminConfirmButton
                      label="隐藏闲置"
                      confirmTitle="确认隐藏该闲置？"
                      confirmDescription="隐藏后前台将不再展示。相关举报将自动标记为已处理。"
                      action={adminHideMarketListingAction}
                      hiddenFields={{ listingId: listing.id }}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">已隐藏</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
