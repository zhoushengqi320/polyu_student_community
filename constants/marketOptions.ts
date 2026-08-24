export const MARKET_CATEGORIES = [
  { id: "textbook", label: "教材 / 笔记" },
  { id: "electronics", label: "电子产品" },
  { id: "furniture", label: "家具 / 家电" },
  { id: "apparel", label: "服饰箱包" },
  { id: "sports", label: "运动户外" },
  { id: "tickets", label: "票券 / 额度" },
  { id: "other", label: "其他" },
] as const;

export type MarketCategoryId = (typeof MARKET_CATEGORIES)[number]["id"];

export const MARKET_CONDITIONS = [
  { id: "new", label: "全新" },
  { id: "like_new", label: "几乎全新" },
  { id: "good", label: "良好" },
  { id: "fair", label: "一般" },
] as const;

export type MarketConditionId = (typeof MARKET_CONDITIONS)[number]["id"];

export const MARKET_TRADE_METHODS = [
  { id: "meetup_campus", label: "校内面交" },
  { id: "meetup_other", label: "约定地点面交" },
] as const;

export type MarketTradeMethodId = (typeof MARKET_TRADE_METHODS)[number]["id"];

export const MARKET_LISTING_STATUSES = [
  { id: "available", label: "在售" },
  { id: "reserved", label: "已预订" },
  { id: "sold", label: "已出" },
] as const;

export type MarketListingStatusId =
  (typeof MARKET_LISTING_STATUSES)[number]["id"];

export const MARKET_SORT_OPTIONS = [
  { id: "latest", label: "最新发布" },
  { id: "price_asc", label: "价格从低到高" },
  { id: "price_desc", label: "价格从高到低" },
] as const;

export type MarketSortId = (typeof MARKET_SORT_OPTIONS)[number]["id"];

export const MARKET_PAGE_SIZE = 12;
export const MARKET_MAX_IMAGES = 3;

export function getMarketCategoryLabel(id: string): string {
  return MARKET_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

export function getMarketConditionLabel(id: string): string {
  return MARKET_CONDITIONS.find((item) => item.id === id)?.label ?? id;
}

export function getMarketTradeMethodLabel(id: string): string {
  const legacyLabels: Record<string, string> = {
    meetup_station: "红磡站附近面交",
    self_pickup: "自取",
  };
  return (
    MARKET_TRADE_METHODS.find((item) => item.id === id)?.label ??
    legacyLabels[id] ??
    id
  );
}

export function isMarketListingSold(status: string): boolean {
  return status === "sold";
}

export function getMarketListingStatusLabel(id: string): string {
  return MARKET_LISTING_STATUSES.find((item) => item.id === id)?.label ?? id;
}

export function formatMarketPrice(priceHkd: number): string {
  if (priceHkd === 0) {
    return "赠送";
  }
  return `HK$${priceHkd.toLocaleString("zh-HK")}`;
}
