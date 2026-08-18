import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { FEEDBACK_MODULE, FEEDBACK_PAGE_SIZE } from "@/constants/feedback";
import {
  buildPostExcerpt,
  mapForumPostDetail,
  mapForumPostListItem,
  type ForumPostWithProfileRow,
} from "@/lib/db/mappers/forum";
import { DbError, getPagination, toPaginatedResult } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type ForumPostDetail,
  type ForumPostListItem,
} from "@/types/forum";
import { type PaginatedResult } from "@/types/common";

function buildFeedbackBaseQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  return supabase
    .from("posts")
    .select("*, profiles(*)", { count: "exact" })
    .eq("module", FEEDBACK_MODULE)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .eq("school_id", DEFAULT_SCHOOL_ID);
}

export async function getFeedbackPosts(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedResult<ForumPostListItem>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? FEEDBACK_PAGE_SIZE;
  const pagination = getPagination(page, pageSize);

  if (!isSupabaseConfigured()) {
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const supabase = await createClient();
  const { data, error, count } = await buildFeedbackBaseQuery(supabase)
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (error) {
    console.error("Failed to get feedback posts:", error);
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const items = ((data ?? []) as ForumPostWithProfileRow[]).map(
    mapForumPostListItem,
  );
  return toPaginatedResult(items, count ?? 0, pagination.page, pagination.pageSize);
}

export async function getFeedbackPostById(
  id: string,
): Promise<ForumPostDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await buildFeedbackBaseQuery(supabase)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapForumPostDetail(data as ForumPostWithProfileRow);
}

export async function createFeedbackPost(input: {
  userId: string;
  title: string;
  content: string;
}): Promise<ForumPostDetail> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const excerpt = buildPostExcerpt(input.content);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      module: FEEDBACK_MODULE,
      user_id: input.userId,
      title: input.title,
      content: input.content,
      excerpt,
      category_id: null,
      topics: [],
      is_anonymous: false,
      status: CONTENT_STATUS.published,
      school_id: DEFAULT_SCHOOL_ID,
    })
    .select("*, profiles(*)")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "提交反馈失败", "VALIDATION");
  }

  return mapForumPostDetail(data as ForumPostWithProfileRow);
}

export async function updateFeedbackPostContent(
  postId: string,
  content: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const excerpt = buildPostExcerpt(content);

  const { error } = await supabase
    .from("posts")
    .update({
      content,
      excerpt,
    })
    .eq("id", postId)
    .eq("module", FEEDBACK_MODULE);

  if (error) {
    throw new DbError(error.message, "VALIDATION");
  }
}
