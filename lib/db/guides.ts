import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS, type ContentStatus } from "@/constants/contentStatus";
import { compareByGuideListOrder } from "@/constants/contentGuideOrder";
import { GUIDE_MODULE } from "@/constants/guides";
import { TARGET_TYPES } from "@/constants/reportReasons";
import {
  mapPostDetail,
  mapPostListItem,
  type PostWithProfileRow,
} from "@/lib/db/mappers/post";
import { mapProfileListItem, type ProfileRow } from "@/lib/db/mappers/profile";
import { createAdminAction, resolveReportsForTarget } from "@/lib/db/reports";
import { DbError, getPagination, toPaginatedResult } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buildSearchPattern } from "@/lib/utils/search";
import {
  type AdminGuideDetail,
  type CreateGuideInput,
  type GuideDetail,
  type GuideFilters,
  type GuideListItem,
  type GuideMeta,
  type GuideSourceLink,
  type UpdateGuideInput,
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
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
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

  const guides = rows
    .map((row) => ({
      ...mapPostListItem(row, {
        commentCount: row.comment_count ?? 0,
        likeCount: row.like_count ?? 0,
      }),
      meta: metaMap.get(row.id) ?? null,
      excerpt: row.excerpt ?? getExcerpt(row.content),
      isFavorited: favoritePostIds.has(row.id),
      ...(search?.trim() ? { content: row.content } : {}),
    }))
    .sort((left, right) =>
      compareByGuideListOrder(GUIDE_MODULE, left.title, right.title),
    );

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

function toSourceLinksJson(sourceLinks: GuideSourceLink[]): Json {
  return sourceLinks as unknown as Json;
}

async function getGuidePostById(id: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("id", id)
    .eq("module", GUIDE_MODULE)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PostWithProfileRow;
}

export async function getAllGuidesForAdmin(
  filters: { page?: number; pageSize?: number } = {},
): Promise<AdminGuideDetail[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { page = 1, pageSize = 100 } = filters;
  const pagination = getPagination(page, pageSize);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("module", GUIDE_MODULE)
    .order("updated_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (error || !data) {
    console.error("Failed to list guides for admin:", error);
    return [];
  }

  const rows = data as PostWithProfileRow[];
  const metaMap = await getGuideMetaByPostIds(rows.map((row) => row.id));

  return rows
    .map((row) => {
      const meta = metaMap.get(row.id) ?? null;

      return {
        id: row.id,
        title: row.title,
        excerpt: row.excerpt,
        content: row.content,
        categoryId: meta?.category ?? row.category_id,
        status: row.status as ContentStatus,
        deletedAt: row.deleted_at,
        author: mapProfileListItem(row.profiles as ProfileRow),
        meta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    })
    .sort((left, right) =>
      compareByGuideListOrder(GUIDE_MODULE, left.title, right.title),
    );
}

export async function getGuideByIdForAdmin(
  id: string,
): Promise<AdminGuideDetail | null> {
  const row = await getGuidePostById(id);
  if (!row) {
    return null;
  }

  const metaMap = await getGuideMetaByPostIds([row.id]);
  const meta = metaMap.get(row.id) ?? null;

  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    categoryId: meta?.category ?? row.category_id,
    status: row.status as ContentStatus,
    deletedAt: row.deleted_at,
    author: mapProfileListItem(row.profiles as ProfileRow),
    meta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createGuide(
  input: CreateGuideInput,
  adminId: string,
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      module: GUIDE_MODULE,
      category_id: input.category,
      user_id: input.userId,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt?.trim() || null,
      status: CONTENT_STATUS.draft,
      school_id: DEFAULT_SCHOOL_ID,
    })
    .select("id")
    .single();

  if (postError || !post) {
    throw new DbError(postError?.message ?? "创建攻略失败", "VALIDATION");
  }

  const postId = String((post as { id: string }).id);
  const { error: metaError } = await supabase.from("guides_meta").insert({
    post_id: postId,
    stage: input.category,
    category: input.category,
    source_links: toSourceLinksJson(input.sourceLinks),
    is_pinned: false,
  });

  if (metaError) {
    await supabase.from("posts").delete().eq("id", postId);
    throw new DbError(metaError.message, "VALIDATION");
  }

  await createAdminAction({
    adminId,
    action: "create_guide",
    targetType: TARGET_TYPES.post,
    targetId: postId,
    metadata: {
      title: input.title,
      category: input.category,
      status: CONTENT_STATUS.draft,
    },
  });

  return postId;
}

export async function updateGuide(
  input: UpdateGuideInput,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const existing = await getGuidePostById(input.id);
  if (!existing) {
    throw DbError.notFound("攻略");
  }

  if (existing.deleted_at) {
    throw new DbError("已删除的攻略无法编辑", "FORBIDDEN");
  }

  const supabase = await createClient();
  const verifiedAt = new Date().toISOString();

  const { error: postError } = await supabase
    .from("posts")
    .update({
      title: input.title,
      content: input.content,
      excerpt: input.excerpt?.trim() || null,
      category_id: input.category,
    })
    .eq("id", input.id)
    .eq("module", GUIDE_MODULE);

  if (postError) {
    throw new DbError(postError.message);
  }

  const { error: metaError } = await supabase
    .from("guides_meta")
    .update({
      stage: input.category,
      category: input.category,
      source_links: toSourceLinksJson(input.sourceLinks),
      last_verified_at: verifiedAt,
    })
    .eq("post_id", input.id);

  if (metaError) {
    throw new DbError(metaError.message);
  }

  await createAdminAction({
    adminId,
    action: "update_guide",
    targetType: TARGET_TYPES.post,
    targetId: input.id,
    metadata: {
      title: input.title,
      category: input.category,
    },
  });
}

export async function publishGuide(id: string, adminId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const existing = await getGuidePostById(id);
  if (!existing) {
    throw DbError.notFound("攻略");
  }

  if (existing.deleted_at) {
    throw new DbError("已删除的攻略无法发布", "FORBIDDEN");
  }

  if (
    existing.status !== CONTENT_STATUS.draft &&
    existing.status !== CONTENT_STATUS.hidden
  ) {
    throw new DbError("只有草稿或已隐藏状态的攻略可以发布", "VALIDATION");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: CONTENT_STATUS.published })
    .eq("id", id)
    .eq("module", GUIDE_MODULE);

  if (error) {
    throw new DbError(error.message);
  }

  await createAdminAction({
    adminId,
    action: "publish_guide",
    targetType: TARGET_TYPES.post,
    targetId: id,
    metadata: {
      previousStatus: existing.status,
      status: CONTENT_STATUS.published,
    },
  });
}

export async function hideGuide(id: string, adminId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const existing = await getGuidePostById(id);
  if (!existing) {
    throw DbError.notFound("攻略");
  }

  if (existing.deleted_at) {
    throw new DbError("已删除的攻略无法隐藏", "FORBIDDEN");
  }

  if (existing.status !== CONTENT_STATUS.published) {
    throw new DbError("只有已发布状态的攻略可以隐藏", "VALIDATION");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: CONTENT_STATUS.hidden })
    .eq("id", id)
    .eq("module", GUIDE_MODULE);

  if (error) {
    throw new DbError(error.message);
  }

  await createAdminAction({
    adminId,
    action: "hide_guide",
    targetType: TARGET_TYPES.post,
    targetId: id,
  });
}

export async function adminDeleteGuide(
  id: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const existing = await getGuidePostById(id);
  if (!existing) {
    throw DbError.notFound("攻略");
  }

  if (existing.deleted_at) {
    throw new DbError("攻略已经删除", "VALIDATION");
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: deletedAt })
    .eq("id", id)
    .eq("module", GUIDE_MODULE);

  if (error) {
    throw new DbError(error.message);
  }

  await createAdminAction({
    adminId,
    action: "delete_guide",
    targetType: TARGET_TYPES.post,
    targetId: id,
    metadata: { deletedAt },
  });

  await resolveReportsForTarget(TARGET_TYPES.post, id, adminId);
}
