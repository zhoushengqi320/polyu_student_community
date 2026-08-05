import { CONTENT_STATUS, type ContentStatus } from "@/constants/contentStatus";
import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { compareByGuideListOrder } from "@/constants/contentGuideOrder";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { createAdminAction, resolveReportsForTarget } from "@/lib/db/reports";
import { DbError } from "@/lib/db/shared";
import { mapProfileListItem, type ProfileRow } from "@/lib/db/mappers/profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type ProfileListItem } from "@/types/user";

export type ContentCmsModule = "study" | "life";

export type AdminContentArticle = {
  id: string;
  module: ContentCmsModule;
  title: string;
  excerpt: string | null;
  content: string;
  categoryId: string | null;
  status: ContentStatus;
  deletedAt: string | null;
  author: ProfileListItem;
  createdAt: string;
  updatedAt: string;
};

type ContentArticleInput = {
  userId: string;
  title: string;
  excerpt?: string | null;
  content: string;
  category: string;
};

type PostRow = {
  id: string;
  module: string;
  title: string;
  excerpt: string | null;
  content: string;
  category_id: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  profiles: ProfileRow;
};

function mapArticle(row: PostRow): AdminContentArticle {
  return {
    id: row.id,
    module: row.module as ContentCmsModule,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    categoryId: row.category_id,
    status: row.status as ContentStatus,
    deletedAt: row.deleted_at,
    author: mapProfileListItem(row.profiles),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listContentArticlesForAdmin(
  module: ContentCmsModule,
  options?: { pageSize?: number },
): Promise<AdminContentArticle[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const pageSize = options?.pageSize ?? 100;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("module", module)
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .order("updated_at", { ascending: false })
    .limit(pageSize);

  if (error || !data) {
    console.error(`Failed to list admin ${module} articles:`, error);
    return [];
  }

  return (data as PostRow[])
    .map(mapArticle)
    .sort((left, right) =>
      compareByGuideListOrder(module, left.title, right.title),
    );
}

export async function createContentArticle(
  module: ContentCmsModule,
  input: ContentArticleInput,
  adminId: string,
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      module,
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

  if (error || !post) {
    throw new DbError(error?.message ?? "创建失败", "VALIDATION");
  }

  const postId = String((post as { id: string }).id);

  await createAdminAction({
    adminId,
    action: "create_content_article",
    targetType: TARGET_TYPES.post,
    targetId: postId,
    metadata: { module, title: input.title, category: input.category },
  });

  return postId;
}

export async function updateContentArticle(
  module: ContentCmsModule,
  input: ContentArticleInput & { id: string },
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("posts")
    .select("id, deleted_at, module")
    .eq("id", input.id)
    .eq("module", module)
    .maybeSingle();

  if (fetchError || !existing) {
    throw DbError.notFound("文章");
  }

  if ((existing as { deleted_at: string | null }).deleted_at) {
    throw new DbError("已删除的文章无法编辑", "FORBIDDEN");
  }

  const { error } = await supabase
    .from("posts")
    .update({
      title: input.title,
      content: input.content,
      excerpt: input.excerpt?.trim() || null,
      category_id: input.category,
    })
    .eq("id", input.id)
    .eq("module", module);

  if (error) {
    throw new DbError(error.message, "VALIDATION");
  }

  await createAdminAction({
    adminId,
    action: "update_content_article",
    targetType: TARGET_TYPES.post,
    targetId: input.id,
    metadata: { module, title: input.title, category: input.category },
  });
}

async function setContentArticleStatus(
  module: ContentCmsModule,
  id: string,
  status: ContentStatus,
  adminId: string,
  action: string,
) {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ status, deleted_at: null })
    .eq("id", id)
    .eq("module", module)
    .is("deleted_at", null);

  if (error) {
    throw new DbError(error.message, "VALIDATION");
  }

  await createAdminAction({
    adminId,
    action,
    targetType: TARGET_TYPES.post,
    targetId: id,
    metadata: { module, status },
  });
}

export async function publishContentArticle(
  module: ContentCmsModule,
  id: string,
  adminId: string,
) {
  return setContentArticleStatus(
    module,
    id,
    CONTENT_STATUS.published,
    adminId,
    "publish_content_article",
  );
}

export async function hideContentArticle(
  module: ContentCmsModule,
  id: string,
  adminId: string,
) {
  return setContentArticleStatus(
    module,
    id,
    CONTENT_STATUS.hidden,
    adminId,
    "hide_content_article",
  );
}

export async function deleteContentArticle(
  module: ContentCmsModule,
  id: string,
  adminId: string,
) {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({
      deleted_at: new Date().toISOString(),
      status: CONTENT_STATUS.hidden,
    })
    .eq("id", id)
    .eq("module", module);

  if (error) {
    throw new DbError(error.message, "VALIDATION");
  }

  await createAdminAction({
    adminId,
    action: "delete_content_article",
    targetType: TARGET_TYPES.post,
    targetId: id,
    metadata: { module },
  });

  await resolveReportsForTarget(TARGET_TYPES.post, id, adminId);
}
