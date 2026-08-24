import {
  type MarketCategoryId,
  type MarketConditionId,
  type MarketListingStatusId,
  type MarketTradeMethodId,
} from "@/constants/marketOptions";
import { type ContentStatus } from "@/constants/contentStatus";
import {
  mapProfileListItemOrFallback,
  type ProfileRow,
} from "@/lib/db/mappers/profile";
import {
  type MarketListing,
  type MarketListingWithAuthor,
} from "@/types/market";

export type MarketListingRow = {
  id: string;
  user_id: string;
  school_id: string;
  title: string;
  description: string;
  price_hkd: number;
  price_negotiable: boolean;
  category: string;
  condition: string;
  trade_methods: string[] | null;
  contact_note: string | null;
  image_urls: string[] | null;
  listing_status: string;
  status: ContentStatus;
  view_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketListingWithProfileRow = MarketListingRow & {
  profiles: ProfileRow | null;
};

export function mapMarketListing(row: MarketListingRow): MarketListing {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    priceHkd: Number(row.price_hkd),
    priceNegotiable: Boolean(row.price_negotiable),
    category: row.category as MarketCategoryId,
    condition: row.condition as MarketConditionId,
    tradeMethods: (row.trade_methods ?? []) as MarketTradeMethodId[],
    contactNote: row.contact_note,
    imageUrls: (row.image_urls ?? []).filter(Boolean),
    listingStatus: row.listing_status as MarketListingStatusId,
    status: row.status,
    viewCount: Number(row.view_count ?? 0),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMarketListingWithAuthor(
  row: MarketListingWithProfileRow,
): MarketListingWithAuthor {
  return {
    ...mapMarketListing(row),
    author: mapProfileListItemOrFallback(row.profiles, row.user_id, "已删除用户"),
  };
}
