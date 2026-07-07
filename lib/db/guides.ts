import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { GUIDE_MODULE } from "@/constants/guides";
import { TARGET_TYPES } from "@/constants/reportReasons";
import {
  mapPostDetail,
  mapPostListItem,
  type PostWithProfileRow,
} from "@/lib/db/mappers/post";
import { getPagination, toPaginatedResult } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buildSearchPattern } from "@/lib/utils/search";
import {
  type GuideDetail,
  type GuideFilters,
  type GuideListItem,
  type GuideMeta,
  type GuideSourceLink,
} from "@/types/guide";
import { type Database, type Json } from "@/types/database";

type GuideMetaRow = Database["public"]["Tables"]["guides_meta"]["Row"];

function readSourceLinks(value: Json): GuideSourceLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const label = typeof item.label === "string" ? item.label.trim() : "";
      const url = typeof item.url === "string" ? item.url.trim() : "";
      if (!label || !url) {
        return null;
      }

      return { label, url };
    })
    .filter((item): item is GuideSourceLink => item !== null);
}

function mapGuideMeta(row: GuideMetaRow | null | undefined): GuideMeta | null {
  if (!row) {
    return null;
  }

  return {
    guideId: row.post_id,
    stage: row.stage,
    category: row.category,
    targetAudience: row.target_audience,
    estimatedReadingTime: row.estimated_reading_time,
    lastVerifiedAt: row.last_verified_at,
    sourceLinks: readSourceLinks(row.source_links),
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getExcerpt(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 160);
}

async function getFavoritePostIds(postIds: string[], userId?: string) {
  const favorites = new Set<string>();
  if (!userId || postIds.length === 0 || !isSupabaseConfigured()) {
    return favorites;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("target_id")
    .eq("user_id", userId)
    .eq("target_type", TARGET_TYPES.post)
    .eq("type", "favorite")
    .in("target_id", postIds);

  if (error) {
    console.error("Failed to list guide favorites:", error);
    return favorites;
  }

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    favorites.add(String(row.target_id));
  }

  return favorites;
}

async function getGuideMetaByPostIds(postIds: string[]) {
  const metas = new Map<string, GuideMeta>();
  if (postIds.length === 0 || !isSupabaseConfigured()) {
    return metas;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guides_meta")
    .select("*")
    .in("post_id", postIds);

  if (error) {
    console.error("Failed to list guide meta:", error);
    return metas;
  }

  for (const row of (data ?? []) as GuideMetaRow[]) {
    const meta = mapGuideMeta(row);
    if (meta) {
      metas.set(meta.guideId, meta);
    }
  }

  return metas;
}

export async function listGuides(
  filters: GuideFilters = {},
  currentUserId?: string,
) {
  const { page = 1, pageSize = 20, category, search } = filters;
  const pagination = getPagination(page, pageSize);

  if (!isSupabaseConfigured()) {
    return toPaginatedResult<GuideListItem>(
      [],
      0,
      pagination.page,
      pagination.pageSize,
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*, profiles(*)", { count: "exact" })
    .eq("module", GUIDE_MODULE)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (category) {
    query = query.eq("category_id", category);
  }

  if (search?.trim()) {
    const pattern = buildSearchPattern(search);
    query = query.or(`title.ilike.${pattern},content.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("Failed to list guides:", error);
    return toPaginatedResult<GuideListItem>(
      [],
      0,
      pagination.page,
      pagination.pageSize,
    );
  }

  const rows = (data ?? []) as PostWithProfileRow[];
  const postIds = rows.map((row) => row.id);
  const [metaMap, favoritePostIds] = await Promise.all([
    getGuideMetaByPostIds(postIds),
    getFavoritePostIds(postIds, currentUserId),
  ]);

  const guides = rows.map((row) => ({
    ...mapPostListItem(row, {
      commentCount: row.comment_count ?? 0,
      likeCount: row.like_count ?? 0,
    }),
    meta: metaMap.get(row.id) ?? null,
    excerpt: row.excerpt ?? getExcerpt(row.content),
    isFavorited: favoritePostIds.has(row.id),
  }));

  return toPaginatedResult(
    guides,
    count ?? 0,
    pagination.page,
    pagination.pageSize,
  );
}

export async function getGuideById(
  id: string,
  currentUserId?: string,
): Promise<GuideDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("id", id)
    .eq("module", GUIDE_MODULE)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as PostWithProfileRow;
  const [metaMap, favoritePostIds] = await Promise.all([
    getGuideMetaByPostIds([row.id]),
    getFavoritePostIds([row.id], currentUserId),
  ]);

  return {
    ...mapPostDetail(row, {
      commentCount: row.comment_count ?? 0,
      likeCount: row.like_count ?? 0,
    }),
    meta: metaMap.get(row.id) ?? null,
    isFavorited: favoritePostIds.has(row.id),
  };
}
