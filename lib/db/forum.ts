import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { CONTENT_RISK_LEVELS } from "@/constants/moderation";
import { FORUM_PAGE_SIZE, type ForumSortId } from "@/constants/forum";
import {
  buildPostExcerpt,
  mapForumPostDetail,
  mapForumPostListItem,
  type ForumPostWithProfileRow,
} from "@/lib/db/mappers/forum";
import { DbError, getPagination, toPaginatedResult } from "@/lib/db/shared";
import { buildSearchPattern } from "@/lib/utils/search";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type CreateForumPostInput,
  type ForumPostDetail,
  type ForumPostListItem,
  type GetForumPostsParams,
  type UpdateForumPostInput,
} from "@/types/forum";
import { type PaginatedResult } from "@/types/common";

const FORUM_MODULE = "forum" as const;

function applyForumSort(query: ReturnType<typeof buildForumBaseQuery>, sort: ForumSortId) {
  switch (sort) {
    case "most_commented":
      return query
        .order("comment_count", { ascending: false })
        .order("created_at", { ascending: false });
    case "most_liked":
      return query
        .order("like_count", { ascending: false })
        .order("created_at", { ascending: false });
    case "most_viewed":
      return query
        .order("view_count", { ascending: false })
        .order("created_at", { ascending: false });
    case "latest":
    default:
      return query.order("created_at", { ascending: false });
  }
}

function buildForumBaseQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("posts")
    .select("*, profiles(*)", { count: "exact" })
    .eq("module", FORUM_MODULE)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .eq("school_id", DEFAULT_SCHOOL_ID);
}

export async function getForumPosts(
  params: GetForumPostsParams = {},
): Promise<PaginatedResult<ForumPostListItem>> {
  const {
    query,
    topic,
    sort = "latest",
    page = 1,
    pageSize = FORUM_PAGE_SIZE,
  } = params;
  const pagination = getPagination(page, pageSize);

  if (!isSupabaseConfigured()) {
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const supabase = await createClient();
  let dbQuery = buildForumBaseQuery(supabase).range(pagination.from, pagination.to);
  dbQuery = applyForumSort(dbQuery, sort);

  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    const pattern = buildSearchPattern(trimmedQuery);
    dbQuery = dbQuery.or(
      `title.ilike.${pattern},content.ilike.${pattern},excerpt.ilike.${pattern}`,
    );
  }

  if (topic?.trim()) {
    dbQuery = dbQuery.contains("topics", [topic.trim()]);
  }

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Failed to get forum posts:", error);
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const items = ((data ?? []) as ForumPostWithProfileRow[]).map(mapForumPostListItem);
  return toPaginatedResult(items, count ?? 0, pagination.page, pagination.pageSize);
}

export async function getForumPostById(id: string): Promise<ForumPostDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await buildForumBaseQuery(supabase)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapForumPostDetail(data as ForumPostWithProfileRow);
}

export async function createForumPost(
  input: CreateForumPostInput,
): Promise<ForumPostDetail> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const excerpt = buildPostExcerpt(input.content);

  const riskLevel = input.riskLevel ?? CONTENT_RISK_LEVELS.low;
  const status =
    riskLevel === CONTENT_RISK_LEVELS.high
      ? CONTENT_STATUS.hidden
      : CONTENT_STATUS.published;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      module: FORUM_MODULE,
      user_id: input.userId,
      title: input.title,
      content: input.content,
      excerpt,
      category_id: null,
      topics: input.topics,
      is_anonymous: input.isAnonymous,
      status,
      risk_level: riskLevel,
      school_id: DEFAULT_SCHOOL_ID,
    })
    .select("*, profiles(*)")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "发帖失败", "VALIDATION");
  }

  return mapForumPostDetail(data as ForumPostWithProfileRow);
}

export async function updateForumPost(
  id: string,
  userId: string,
  input: UpdateForumPostInput,
): Promise<ForumPostDetail> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }
  if (input.content !== undefined) {
    payload.content = input.content;
    payload.excerpt = buildPostExcerpt(input.content);
  }
  if (input.topics !== undefined) {
    payload.topics = input.topics;
  }
  if (input.isAnonymous !== undefined) {
    payload.is_anonymous = input.isAnonymous;
  }

  const { data, error } = await supabase
    .from("posts")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("module", FORUM_MODULE)
    .select("*, profiles(*)")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "更新帖子失败");
  }

  return mapForumPostDetail(data as ForumPostWithProfileRow);
}

export async function deleteForumPost(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("module", FORUM_MODULE)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new DbError(error?.message ?? "帖子不存在或无权删除");
  }
}

export async function incrementForumPostViewCount(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_post_view_count", {
    post_id: id,
  });

  if (error) {
    console.error(
      "Failed to increment view count:",
      error.message ?? error.code ?? error,
    );
  }
}

export async function getMostViewedForumPosts(
  limit = 5,
): Promise<ForumPostListItem[]> {
  const result = await getForumPosts({ sort: "most_viewed", pageSize: limit });
  return result.data;
}

/** @deprecated 使用 getMostViewedForumPosts */
export async function getHotForumPosts(limit = 5): Promise<ForumPostListItem[]> {
  return getMostViewedForumPosts(limit);
}

export async function getPostsByTopic(
  topic: string,
  limit = 20,
): Promise<ForumPostListItem[]> {
  const result = await getForumPosts({ topic, pageSize: limit, sort: "latest" });
  return result.data;
}

export async function getForumTopics(limit = 20): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("topics")
    .eq("module", FORUM_MODULE)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .limit(200);

  if (error || !data) {
    return [];
  }

  const counts = new Map<string, number>();

  for (const row of data) {
    for (const topic of row.topics ?? []) {
      const trimmed = topic.trim();
      if (!trimmed) {
        continue;
      }
      counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic]) => topic);
}
