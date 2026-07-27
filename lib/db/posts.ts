import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import {
  mapPostDetail,
  mapPostListItem,
  type PostWithProfileRow,
} from "@/lib/db/mappers/post";
import { DbError, getPagination, toPaginatedResult } from "@/lib/db/shared";
import { buildSearchPattern } from "@/lib/utils/search";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type CreatePostInput,
  type PostDetail,
  type PostFilters,
  type PostListItem,
} from "@/types/post";
import { type PaginatedResult } from "@/types/common";

async function getPostCounts(postIds: string[]) {
  if (postIds.length === 0) {
    return new Map<string, { commentCount: number; likeCount: number }>();
  }

  const supabase = await createClient();

  const [{ data: comments }, { data: likes }] = await Promise.all([
    supabase
      .from("comments")
      .select("target_id")
      .eq("target_type", TARGET_TYPES.post)
      .in("target_id", postIds)
      .eq("status", CONTENT_STATUS.published)
      .is("deleted_at", null),
    supabase
      .from("reactions")
      .select("target_id")
      .eq("target_type", TARGET_TYPES.post)
      .eq("type", "like")
      .in("target_id", postIds),
  ]);

  const counts = new Map<string, { commentCount: number; likeCount: number }>();

  for (const id of postIds) {
    counts.set(id, { commentCount: 0, likeCount: 0 });
  }

  for (const row of comments ?? []) {
    const current = counts.get(row.target_id);
    if (current) {
      current.commentCount += 1;
    }
  }

  for (const row of likes ?? []) {
    const current = counts.get(row.target_id);
    if (current) {
      current.likeCount += 1;
    }
  }

  return counts;
}

export async function listPosts(
  filters: PostFilters,
): Promise<PaginatedResult<PostListItem>> {
  const { page = 1, pageSize = 20, module, categoryId, search } = filters;
  const pagination = getPagination(page, pageSize);

  if (!isSupabaseConfigured()) {
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, profiles(*)", { count: "exact" })
    .eq("module", module)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (search?.trim()) {
    query = query.or(
      `title.ilike.${buildSearchPattern(search)},content.ilike.${buildSearchPattern(search)}`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to list posts:", error);
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const rows = (data ?? []) as PostWithProfileRow[];
  const postIds = rows.map((row) => row.id);
  const countsMap = await getPostCounts(postIds);

  const items = rows.map((row) =>
    mapPostListItem(row, countsMap.get(row.id) ?? { commentCount: 0, likeCount: 0 }),
  );

  return toPaginatedResult(items, count ?? 0, pagination.page, pagination.pageSize);
}

export async function getPostById(
  id: string,
  module?: PostFilters["module"],
): Promise<PostDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("id", id)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null);

  if (module) {
    query = query.eq("module", module);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as PostWithProfileRow;
  const countsMap = await getPostCounts([row.id]);
  return mapPostDetail(
    row,
    countsMap.get(row.id) ?? { commentCount: 0, likeCount: 0 },
  );
}

export async function createPost(input: CreatePostInput): Promise<PostDetail> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      module: input.module,
      category_id: input.categoryId ?? "general",
      user_id: input.userId,
      title: input.title,
      content: input.content,
      status: CONTENT_STATUS.published,
      school_id: DEFAULT_SCHOOL_ID,
    })
    .select("*, profiles(*)")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "发帖失败", "VALIDATION");
  }

  return mapPostDetail(data as PostWithProfileRow, {
    commentCount: 0,
    likeCount: 0,
  });
}

export async function softDeletePost(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new DbError(error.message);
  }
}
