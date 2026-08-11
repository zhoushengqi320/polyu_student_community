import { CONTENT_STATUS } from "@/constants/contentStatus";
import { REPORT_STATUS } from "@/constants/reportReasons";
import { USER_STATUS } from "@/constants/userRoles";
import { mapAdminUserListItem } from "@/lib/db/mappers/admin";
import { mapProfileListItem, type ProfileRow } from "@/lib/db/mappers/profile";
import { createAdminAction, logAdminAction, resolveReportsForTarget } from "@/lib/db/reports";
import { DbError, getPagination } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type AdminCourseReviewListItem,
  type AdminForumCommentListItem,
  type AdminForumPostListItem,
  type AdminListFilters,
  type AdminActionFilters,
  type AdminStats,
  type AdminUserFilters,
  type AdminUserListItem,
} from "@/types/admin";
import { TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { type AdminActionLogWithAdmin } from "@/types/report";

const EMPTY_STATS: AdminStats = {
  userCount: 0,
  pendingReportCount: 0,
  pendingProfileReviewCount: 0,
  postCount: 0,
};

export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured()) {
    return EMPTY_STATS;
  }

  const supabase = await createClient();

  const [
    { count: userCount },
    { count: pendingReportCount },
    { count: pendingProfileReviewCount },
    { count: postCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", REPORT_STATUS.pending),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("profile_review_status", "pending"),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", CONTENT_STATUS.published)
      .is("deleted_at", null),
  ]);

  return {
    userCount: userCount ?? 0,
    pendingReportCount: pendingReportCount ?? 0,
    pendingProfileReviewCount: pendingProfileReviewCount ?? 0,
    postCount: postCount ?? 0,
  };
}

export async function listUsers(
  filters: AdminUserFilters = {},
): Promise<AdminUserListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { page = 1, pageSize = 50, search, role, status } = filters;
  const pagination = getPagination(page, pageSize);
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (role) {
    query = query.eq("role", role);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (search?.trim()) {
    query = query.or(
      `username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%,nickname.ilike.%${search.trim()}%,approved_nickname.ilike.%${search.trim()}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to list users:", error);
    return [];
  }

  return (data ?? []).map(mapAdminUserListItem);
}

export async function banUser(
  userId: string,
  adminId: string,
  reason?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: USER_STATUS.banned })
    .eq("id", userId)
    .neq("role", "admin");

  if (error) {
    throw new DbError(error.message);
  }

  await logAdminAction({
    adminId,
    action: "ban_user",
    targetType: "user",
    targetId: userId,
    metadata: reason ? { reason } : null,
  });
}

export async function unbanUser(userId: string, adminId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: USER_STATUS.active })
    .eq("id", userId);

  if (error) {
    throw new DbError(error.message);
  }

  await logAdminAction({
    adminId,
    action: "unban_user",
    targetType: "user",
    targetId: userId,
  });
}

export async function verifyPolyuUser(
  userId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      role: "verified_polyu_user",
      polyu_verified_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("role", "user");

  if (error) {
    throw new DbError(error.message);
  }

  await logAdminAction({
    adminId,
    action: "verify_polyu_user",
    targetType: "user",
    targetId: userId,
  });
}

export async function listPendingProfileReviews(
  pageSize = 100,
): Promise<import("@/types/admin").AdminProfileReviewItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, nickname, avatar_url, approved_nickname, approved_avatar_url, profile_review_status, review_reason, grade, major, updated_at",
    )
    .eq("profile_review_status", "pending")
    .order("updated_at", { ascending: true })
    .limit(pageSize);

  if (error) {
    console.error("Failed to list profile reviews:", error);
    return [];
  }

  return (data ?? []).map((row: {
    id: string;
    nickname: string | null;
    avatar_url: string | null;
    approved_nickname: string | null;
    approved_avatar_url: string | null;
    profile_review_status: "pending" | "approved" | "rejected";
    review_reason: string | null;
    grade: string | null;
    major: string | null;
    updated_at: string;
  }) => ({
    id: row.id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    approvedNickname: row.approved_nickname,
    approvedAvatarUrl: row.approved_avatar_url,
    profileReviewStatus: row.profile_review_status,
    reviewReason: row.review_reason,
    grade: row.grade,
    major: row.major,
    updatedAt: row.updated_at,
  }));
}

export async function approveProfileReview(
  userId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    throw new DbError(fetchError?.message ?? "用户不存在");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      approved_nickname: profile.nickname,
      approved_avatar_url: profile.avatar_url,
      display_name: profile.nickname,
      profile_review_status: "approved",
      review_reason: null,
    })
    .eq("id", userId);

  if (error) {
    throw new DbError(error.message);
  }

  await logAdminAction({
    adminId,
    action: "approve_profile",
    targetType: "user",
    targetId: userId,
  });
}

export async function rejectProfileReview(
  userId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      profile_review_status: "rejected",
      review_reason: reason.trim() || "资料未通过审核，请修改后重新提交",
    })
    .eq("id", userId);

  if (error) {
    throw new DbError(error.message);
  }

  await logAdminAction({
    adminId,
    action: "reject_profile",
    targetType: "user",
    targetId: userId,
    metadata: { reason },
  });
}

export async function hideContent(
  targetType: TargetType,
  targetId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();

  if (targetType === "post") {
    const { error } = await supabase
      .from("posts")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId);

    if (error) {
      throw new DbError(error.message);
    }
  } else if (targetType === "comment") {
    const { error } = await supabase
      .from("comments")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId);

    if (error) {
      throw new DbError(error.message);
    }
  } else {
    throw new DbError("暂不支持隐藏该类型内容");
  }

  await logAdminAction({
    adminId,
    action: "hide_content",
    targetType,
    targetId,
  });
}

const FORUM_MODULE = "forum" as const;

export async function getAllForumPosts(
  filters: AdminListFilters = {},
): Promise<AdminForumPostListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { page = 1, pageSize = 50 } = filters;
  const pagination = getPagination(page, pageSize);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("module", FORUM_MODULE)
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (error || !data) {
    console.error("Failed to get forum posts for admin:", error);
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((row) => {
    const profile = row.profiles as ProfileRow;
    return {
      id: String(row.id),
      title: String(row.title),
      categoryId: (row.category_id as string | null) ?? null,
      author: mapProfileListItem(profile),
      createdAt: String(row.created_at),
      deletedAt: (row.deleted_at as string | null) ?? null,
      status: String(row.status),
    };
  });
}

export async function getAllForumComments(
  filters: AdminListFilters = {},
): Promise<AdminForumCommentListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { page = 1, pageSize = 50 } = filters;
  const pagination = getPagination(page, pageSize);
  const supabase = await createClient();

  const { data: forumPosts } = await supabase
    .from("posts")
    .select("id, title")
    .eq("module", FORUM_MODULE);

  const postMap = new Map(
    ((forumPosts ?? []) as Array<Record<string, unknown>>).map((post) => [
      String(post.id),
      String(post.title),
    ]),
  );
  const forumPostIds = [...postMap.keys()];

  if (forumPostIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("target_type", TARGET_TYPES.post)
    .in("target_id", forumPostIds)
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (error || !data) {
    console.error("Failed to get forum comments for admin:", error);
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((row) => {
    const profile = row.profiles as ProfileRow;
    const postId = String(row.target_id);
    return {
      id: String(row.id),
      content: String(row.content),
      author: mapProfileListItem(profile),
      postId,
      postTitle: postMap.get(postId) ?? "未知帖子",
      createdAt: String(row.created_at),
      deletedAt: (row.deleted_at as string | null) ?? null,
      status: String(row.status),
    };
  });
}

export async function getAllCourseReviews(
  filters: AdminListFilters = {},
): Promise<AdminCourseReviewListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { page = 1, pageSize = 50 } = filters;
  const pagination = getPagination(page, pageSize);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_reviews")
    .select("*, profiles(*), courses(id, code, name)")
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (error || !data) {
    console.error("Failed to get course reviews for admin:", error);
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((row) => {
    const profile = row.profiles as ProfileRow;
    const course = row.courses as Record<string, unknown> | null;

    return {
      id: String(row.id),
      courseId: String(row.course_id),
      courseCode: String(course?.code ?? "UNKNOWN"),
      courseName: String(course?.name ?? "未知课程"),
      author: mapProfileListItem(profile),
      overallRating: Number(row.overall_rating ?? 0),
      difficultyRating: Number(row.difficulty_rating ?? 0),
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
      reviewText: String(row.review_text ?? row.content ?? ""),
      isAnonymous: Boolean(row.is_anonymous),
      createdAt: String(row.created_at),
      deletedAt: (row.deleted_at as string | null) ?? null,
      status: String(row.status),
    };
  });
}

export async function adminDeleteForumPost(
  postId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("posts")
    .update({ deleted_at: deletedAt })
    .eq("id", postId)
    .eq("module", FORUM_MODULE)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }

  if (!data) {
    throw new DbError("论坛帖不存在或已删除", "VALIDATION");
  }

  await createAdminAction({
    adminId,
    action: "delete_forum_post",
    targetType: TARGET_TYPES.post,
    targetId: postId,
    metadata: { deletedAt },
  });

  await resolveReportsForTarget(TARGET_TYPES.post, postId, adminId);
}

export async function adminDeleteReportedPost(
  postId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, module, deleted_at")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }

  if (!data) {
    throw new DbError("内容不存在", "VALIDATION");
  }

  if (data.deleted_at) {
    await resolveReportsForTarget(TARGET_TYPES.post, postId, adminId);
    return;
  }

  const postModule = String(data.module);

  if (postModule === FORUM_MODULE) {
    await adminDeleteForumPost(postId, adminId);
    return;
  }

  if (postModule === "guides") {
    const { adminDeleteGuide } = await import("@/lib/db/guides");
    await adminDeleteGuide(postId, adminId);
    return;
  }

  if (postModule === "study" || postModule === "life") {
    const { deleteContentArticle } = await import("@/lib/db/contentCms");
    await deleteContentArticle(postModule, postId, adminId);
    return;
  }

  throw new DbError(`不支持删除 module=${postModule} 的内容`, "VALIDATION");
}

export async function adminDeleteForumComment(
  commentId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();

  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: deletedAt })
    .eq("id", commentId);

  if (error) {
    throw new DbError(error.message);
  }

  await createAdminAction({
    adminId,
    action: "delete_forum_comment",
    targetType: TARGET_TYPES.comment,
    targetId: commentId,
    metadata: { deletedAt },
  });

  await resolveReportsForTarget(TARGET_TYPES.comment, commentId, adminId);
}

export async function adminDeleteCourseReview(
  reviewId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const courseReviews = supabase.from("course_reviews") as ReturnType<
    typeof supabase.from
  > & {
    update: (payload: Record<string, unknown>) => ReturnType<
      ReturnType<typeof supabase.from>["update"]
    >;
  };

  const { error } = await courseReviews
    .update({
      status: CONTENT_STATUS.hidden,
      deleted_at: deletedAt,
    })
    .eq("id", reviewId);

  if (error) {
    throw new DbError(error.message);
  }

  await createAdminAction({
    adminId,
    action: "delete_course_review",
    targetType: TARGET_TYPES.course_review,
    targetId: reviewId,
    metadata: { deletedAt },
  });

  await resolveReportsForTarget(TARGET_TYPES.course_review, reviewId, adminId);
}

export async function getAdminActions(
  filters: AdminActionFilters = {},
): Promise<AdminActionLogWithAdmin[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { page = 1, pageSize = 50 } = filters;
  const pagination = getPagination(page, pageSize);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admin_action_logs")
    .select("*, profiles!admin_action_logs_admin_id_fkey(*)")
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (error) {
    const fallback = await supabase
      .from("admin_action_logs")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .range(pagination.from, pagination.to);

    if (fallback.error || !fallback.data) {
      console.error("Failed to get admin actions:", error);
      return [];
    }

    return mapAdminActionRows(fallback.data as Array<Record<string, unknown>>);
  }

  return mapAdminActionRows((data ?? []) as Array<Record<string, unknown>>);
}

function mapAdminActionRows(rows: Array<Record<string, unknown>>): AdminActionLogWithAdmin[] {
  return rows.map((row) => {
    const profile = row.profiles as ProfileRow;
    return {
      id: String(row.id),
      adminId: String(row.admin_id),
      action: String(row.action),
      targetType: String(row.target_type) as TargetType | "user",
      targetId: String(row.target_id),
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: String(row.created_at),
      admin: mapProfileListItem(profile),
    };
  });
}

