import { CONTENT_STATUS } from "@/constants/contentStatus";
import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { compareByGuideListOrder } from "@/constants/contentGuideOrder";
import {
  mapPostDetail,
  mapPostListItem,
  type PostWithProfileRow,
} from "@/lib/db/mappers/post";
import { getPagination, toPaginatedResult } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type ContentGuideDetail,
  type ContentGuideListItem,
} from "@/types/contentGuide";
import { type ModuleKey, type PaginatedResult } from "@/types/common";

function getExcerpt(content: string, excerpt: string | null) {
  if (excerpt?.trim()) return excerpt.trim();
  return content.replace(/\s+/g, " ").trim().slice(0, 160);
}

export async function listContentGuides(
  module: Extract<ModuleKey, "study" | "life">,
  page = 1,
  pageSize = 50,
): Promise<PaginatedResult<ContentGuideListItem>> {
  if (!isSupabaseConfigured()) {
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }

  const pagination = getPagination(page, pageSize);
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("posts")
    .select("*, profiles(*)", { count: "exact" })
    .eq("module", module)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(pagination.from, pagination.to);

  if (error || !data) {
    console.error(`Failed to list ${module} guides:`, error);
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }

  const items = (data as PostWithProfileRow[])
    .map((row) => ({
      ...mapPostListItem(row, {
        commentCount: row.comment_count ?? 0,
        likeCount: row.like_count ?? 0,
      }),
      excerpt: getExcerpt(row.content, row.excerpt),
    }))
    .sort((left, right) =>
      compareByGuideListOrder(module, left.title, right.title),
    );

  return toPaginatedResult(items, count ?? items.length, page, pageSize);
}

export async function getContentGuideById(
  module: Extract<ModuleKey, "study" | "life">,
  id: string,
): Promise<ContentGuideDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("id", id)
    .eq("module", module)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as PostWithProfileRow;
  return {
    ...mapPostDetail(row, {
      commentCount: row.comment_count ?? 0,
      likeCount: row.like_count ?? 0,
    }),
    excerpt: getExcerpt(row.content, row.excerpt),
  };
}
