import { type ContentStatus } from "@/constants/contentStatus";
import {
  type MarketCategoryId,
  type MarketConditionId,
  type MarketListingStatusId,
  type MarketSortId,
  type MarketTradeMethodId,
} from "@/constants/marketOptions";
import { type ProfileListItem } from "@/types/user";

export type MarketListing = {
  id: string;
  userId: string;
  title: string;
  description: string;
  priceHkd: number;
  priceNegotiable: boolean;
  category: MarketCategoryId;
  condition: MarketConditionId;
  tradeMethods: MarketTradeMethodId[];
  contactNote: string | null;
  imageUrls: string[];
  listingStatus: MarketListingStatusId;
  status: ContentStatus;
  viewCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketListingWithAuthor = MarketListing & {
  author: ProfileListItem;
};

export type MarketFilters = {
  category?: MarketCategoryId;
  listingStatus?: MarketListingStatusId;
  search?: string;
  sort?: MarketSortId;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  userId?: string;
  /** 后台列表包含非公开内容 */
  includeHidden?: boolean;
};

export type CreateMarketListingInput = {
  userId: string;
  title: string;
  description: string;
  priceHkd: number;
  priceNegotiable: boolean;
  category: MarketCategoryId;
  condition: MarketConditionId;
  tradeMethods: MarketTradeMethodId[];
  contactNote?: string | null;
  imageUrls?: string[];
};

export type UpdateMarketListingInput = {
  title: string;
  description: string;
  priceHkd: number;
  priceNegotiable: boolean;
  category: MarketCategoryId;
  condition: MarketConditionId;
  tradeMethods: MarketTradeMethodId[];
  contactNote?: string | null;
  imageUrls?: string[];
  listingStatus: MarketListingStatusId;
};
