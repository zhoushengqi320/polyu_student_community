import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import {
  mapMarketListing,
  mapMarketListingWithAuthor,
  type MarketListingRow,
  type MarketListingWithProfileRow,
} from "@/lib/db/mappers/market";
import { createAdminAction, resolveReportsForTarget } from "@/lib/db/reports";
import { DbError, getPagination, toPaginatedResult } from "@/lib/db/shared";
import { buildSearchPattern } from "@/lib/utils/search";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type PaginatedResult } from "@/types/common";
import {
  type CreateMarketListingInput,
  type MarketFilters,
  type MarketListing,
  type MarketListingWithAuthor,
  type UpdateMarketListingInput,
} from "@/types/market";
import { type MarketListingStatusId } from "@/constants/marketOptions";

const LISTING_SELECT = "*, profiles(*)";

export async function listMarketListings(
  filters: MarketFilters = {},
): Promise<PaginatedResult<MarketListingWithAuthor>> {
  const {
    page = 1,
    pageSize = 12,
    category,
    listingStatus,
    search,
    sort = "latest",
    minPrice,
    maxPrice,
    userId,
    includeHidden = false,
  } = filters;
  const pagination = getPagination(page, pageSize);

  if (!isSupabaseConfigured()) {
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const supabase = await createClient();
  let query = supabase
    .from("marketplace_listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .is("deleted_at", null)
    .range(pagination.from, pagination.to);

  if (!includeHidden) {
    query = query.eq("status", CONTENT_STATUS.published);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (listingStatus) {
    query = query.eq("listing_status", listingStatus);
  } else if (!includeHidden && !userId) {
    // 前台默认只展示在售与已预订，已出需通过状态筛选查看
    query = query.in("listing_status", ["available", "reserved"]);
  }

  if (typeof minPrice === "number") {
    query = query.gte("price_hkd", minPrice);
  }

  if (typeof maxPrice === "number") {
    query = query.lte("price_hkd", maxPrice);
  }

  if (search?.trim()) {
    const pattern = buildSearchPattern(search);
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  switch (sort) {
    case "price_asc":
      query = query
        .order("price_hkd", { ascending: true })
        .order("created_at", { ascending: false });
      break;
    case "price_desc":
      query = query
        .order("price_hkd", { ascending: false })
        .order("created_at", { ascending: false });
      break;
    case "latest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) {
    throw new DbError(error.message);
  }

  const rows = (data ?? []) as MarketListingWithProfileRow[];
  return toPaginatedResult(
    rows.map(mapMarketListingWithAuthor),
    count ?? 0,
    pagination.page,
    pagination.pageSize,
  );
}

export async function getMarketListingById(
  id: string,
  options: { includeHidden?: boolean; ownerId?: string } = {},
): Promise<MarketListingWithAuthor | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  let query = supabase
    .from("marketplace_listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .is("deleted_at", null);

  if (!options.includeHidden) {
    query = query.eq("status", CONTENT_STATUS.published);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    return null;
  }

  const listing = mapMarketListingWithAuthor(data as MarketListingWithProfileRow);
  if (
    !options.includeHidden &&
    listing.status !== CONTENT_STATUS.published &&
    listing.userId !== options.ownerId
  ) {
    return null;
  }

  return listing;
}

export async function createMarketListing(
  input: CreateMarketListingInput,
): Promise<MarketListingWithAuthor> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({
      user_id: input.userId,
      school_id: DEFAULT_SCHOOL_ID,
      title: input.title,
      description: input.description,
      price_hkd: input.priceHkd,
      price_negotiable: input.priceNegotiable,
      category: input.category,
      condition: input.condition,
      trade_methods: input.tradeMethods,
      contact_note: input.contactNote ?? null,
      image_urls: input.imageUrls ?? [],
      listing_status: "available",
      status: CONTENT_STATUS.published,
    })
    .select(LISTING_SELECT)
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "发布失败");
  }

  return mapMarketListingWithAuthor(data as MarketListingWithProfileRow);
}

export async function updateMarketListing(
  listingId: string,
  userId: string,
  input: UpdateMarketListingInput,
): Promise<MarketListingWithAuthor> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .update({
      title: input.title,
      description: input.description,
      price_hkd: input.priceHkd,
      price_negotiable: input.priceNegotiable,
      category: input.category,
      condition: input.condition,
      trade_methods: input.tradeMethods,
      contact_note: input.contactNote ?? null,
      image_urls: input.imageUrls ?? [],
      listing_status: input.listingStatus,
    })
    .eq("id", listingId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select(LISTING_SELECT)
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("闲置不存在或无权编辑");
  }

  return mapMarketListingWithAuthor(data as MarketListingWithProfileRow);
}

export async function updateMarketListingImageUrls(
  listingId: string,
  imageUrls: string[],
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("marketplace_listings")
    .update({ image_urls: imageUrls })
    .eq("id", listingId);

  if (error) {
    throw new DbError(error.message);
  }
}

export async function updateMarketListingStatus(
  listingId: string,
  userId: string,
  listingStatus: MarketListingStatusId,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .update({ listing_status: listingStatus })
    .eq("id", listingId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("闲置不存在或无权更新");
  }
}

export async function softDeleteMarketListing(
  listingId: string,
  userId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .update({
      status: CONTENT_STATUS.hidden,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("闲置不存在或无权删除");
  }
}

export async function adminHideMarketListing(
  listingId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .update({ status: CONTENT_STATUS.hidden })
    .eq("id", listingId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    const { data: existing } = await supabase
      .from("marketplace_listings")
      .select("id")
      .eq("id", listingId)
      .maybeSingle();
    if (!existing) {
      throw new DbError("闲置不存在", "VALIDATION");
    }
  }

  await createAdminAction({
    adminId,
    action: "hide_market_listing",
    targetType: TARGET_TYPES.market_listing,
    targetId: listingId,
  });
  await resolveReportsForTarget(
    TARGET_TYPES.market_listing,
    listingId,
    adminId,
  );
}

export async function listMarketListingsForAdmin(
  limit = 100,
): Promise<MarketListingWithAuthor[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select(LISTING_SELECT)
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new DbError(error.message);
  }

  return ((data ?? []) as MarketListingWithProfileRow[]).map(
    mapMarketListingWithAuthor,
  );
}

export async function mapMarketListingPlain(
  row: MarketListingRow,
): Promise<MarketListing> {
  return mapMarketListing(row);
}
