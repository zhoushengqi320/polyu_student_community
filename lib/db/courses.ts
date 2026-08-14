import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import {
  mapCourse,
  mapCourseReviewWithAuthor,
  mapCourseWithStats,
  type CourseReviewWithProfileRow,
  type CourseRow,
  type CourseWithStatsRow,
} from "@/lib/db/mappers/course";
import { type PaginatedResult } from "@/types/common";
import {
  type CourseDetail,
  type CourseFilters,
  type CourseReviewWithAuthor,
  type CourseWithStats,
  type CreateCourseReviewInput,
} from "@/types/course";
import { DbError, toPaginatedResult, getPagination } from "@/lib/db/shared";
import {
  buildCourseSearchOrFilter,
  sortCoursesBySearchRelevance,
} from "@/lib/utils/courseSearch";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeCourseCodeParam } from "@/lib/courses/courseCode";

const COURSE_SEARCH_FETCH_CAP = 5000;

export async function listCourses(
  filters: CourseFilters = {},
): Promise<PaginatedResult<CourseWithStats>> {
  const {
    page = 1,
    pageSize = 20,
    search,
    department,
    faculty,
    sort = "code",
  } = filters;
  const pagination = getPagination(page, pageSize);
  const searchTerm = search?.trim();

  if (!isSupabaseConfigured()) {
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select("*", { count: "exact" })
    .eq("school_id", DEFAULT_SCHOOL_ID);

  if (department) {
    query = query.eq("department", department);
  }

  if (faculty) {
    query = query.eq("faculty", faculty);
  }

  if (searchTerm) {
    const orFilter = buildCourseSearchOrFilter(searchTerm);
    if (orFilter) {
      query = query.or(orFilter);
    }

    query = query.limit(COURSE_SEARCH_FETCH_CAP);
    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to list courses:", error);
      return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
    }

    const ranked = sortCoursesBySearchRelevance(
      ((data ?? []) as CourseWithStatsRow[]).map(mapCourseWithStats),
      searchTerm,
    );
    const total = Math.min(count ?? ranked.length, COURSE_SEARCH_FETCH_CAP);
    const paginated = ranked.slice(pagination.from, pagination.to + 1);

    return toPaginatedResult(
      paginated,
      total,
      pagination.page,
      pagination.pageSize,
    );
  }

  switch (sort) {
    case "rating":
      query = query.order("overall_rating", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "difficulty":
      query = query.order("difficulty_rating", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "review_count":
      query = query.order("review_count", { ascending: false });
      break;
    case "latest":
      query = query.order("created_at", { ascending: false });
      break;
    case "code":
    default:
      query = query.order("code", { ascending: true });
  }
  query = query.range(pagination.from, pagination.to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Failed to list courses:", error);
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const courses = ((data ?? []) as CourseWithStatsRow[]).map(mapCourseWithStats);
  return toPaginatedResult(
    courses,
    count ?? 0,
    pagination.page,
    pagination.pageSize,
  );
}

export async function getCourseByCode(courseCode: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const normalized = normalizeCourseCodeParam(courseCode);
  if (!normalized) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .eq("code", normalized)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCourse(data as CourseRow);
}

export async function getCourseDetailByCode(
  courseCode: string,
  currentUserId?: string,
): Promise<CourseDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const normalized = normalizeCourseCodeParam(courseCode);
  if (!normalized) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .eq("code", normalized)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const course = mapCourseWithStats(data as CourseWithStatsRow);
  const reviews = await listCourseReviews(course.id, currentUserId);

  return {
    ...course,
    reviews,
  };
}

export async function listCourseReviews(
  courseId: string,
  currentUserId?: string,
): Promise<CourseReviewWithAuthor[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_reviews")
    .select("*, profiles(*)")
    .eq("course_id", courseId)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list course reviews:", error);
    return [];
  }

  const reviews = ((data ?? []) as CourseReviewWithProfileRow[]).map(
    mapCourseReviewWithAuthor,
  );
  const reviewIds = reviews.map((review) => review.id);

  if (reviewIds.length === 0) {
    return reviews;
  }

  const { data: reactions, error: reactionsError } = await supabase
    .from("reactions")
    .select("target_id, user_id")
    .eq("target_type", TARGET_TYPES.course_review)
    .eq("type", "like")
    .in("target_id", reviewIds);

  if (reactionsError) {
    console.error("Failed to list course review reactions:", reactionsError);
    return reviews;
  }

  const usefulCounts = new Map<string, number>();
  const usefulByCurrentUser = new Set<string>();

  for (const reaction of (reactions ?? []) as Array<Record<string, unknown>>) {
    const targetId = String(reaction.target_id);
    usefulCounts.set(targetId, (usefulCounts.get(targetId) ?? 0) + 1);
    if (currentUserId && reaction.user_id === currentUserId) {
      usefulByCurrentUser.add(targetId);
    }
  }

  return reviews.map((review) => ({
    ...review,
    usefulCount: usefulCounts.get(review.id) ?? 0,
    isMarkedUseful: usefulByCurrentUser.has(review.id),
  }));
}

export async function createCourseReview(
  input: CreateCourseReviewInput,
): Promise<CourseReviewWithAuthor> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const courseReviews = supabase.from("course_reviews") as ReturnType<
    typeof supabase.from
  > & {
    insert: (payload: Record<string, unknown>) => ReturnType<
      ReturnType<typeof supabase.from>["insert"]
    >;
  };
  const { data, error } = await courseReviews
    .insert({
      course_id: input.courseId,
      user_id: input.userId,
      semester: input.semester,
      teacher_name: input.teacherName,
      overall_rating: input.overallRating,
      difficulty_rating: input.difficultyRating,
      workload_rating: input.workloadRating,
      grading_rating: input.gradingRating,
      exam_difficulty: input.examDifficulty,
      teaching_rating: input.teachingRating,
      exam_type: input.examType,
      assignment_type: input.assignmentType,
      attendance_required: input.attendanceRequired,
      content: input.reviewText,
      review_text: input.reviewText,
      tips: input.tips,
      is_anonymous: input.isAnonymous,
      tags: input.tags,
      status: CONTENT_STATUS.published,
    })
    .select("*, profiles(*)")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "发布课程评价失败", "VALIDATION");
  }

  return mapCourseReviewWithAuthor(data as CourseReviewWithProfileRow);
}

export async function softDeleteCourseReview(
  reviewId: string,
  userId: string,
  options: { allowAdmin?: boolean } = {},
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const courseReviews = supabase.from("course_reviews") as ReturnType<
    typeof supabase.from
  > & {
    update: (payload: Record<string, unknown>) => ReturnType<
      ReturnType<typeof supabase.from>["update"]
    >;
  };

  let query = courseReviews
    .update({
      status: CONTENT_STATUS.hidden,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .is("deleted_at", null);

  if (!options.allowAdmin) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.select("id").maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("评价不存在或无权删除");
  }
}

export async function listCoursesForAdminPage(options: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<{
  items: CourseWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!isSupabaseConfigured()) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select("*", { count: "exact" })
    .eq("school_id", DEFAULT_SCHOOL_ID);

  if (options.search?.trim()) {
    const searchTerm = options.search.trim();
    const orFilter = buildCourseSearchOrFilter(searchTerm);
    if (orFilter) {
      query = query.or(orFilter);
    }

    query = query.limit(COURSE_SEARCH_FETCH_CAP);
    const { data, error, count } = await query;

    if (error) {
      throw new DbError(error.message);
    }

    const ranked = sortCoursesBySearchRelevance(
      ((data ?? []) as CourseWithStatsRow[]).map(mapCourseWithStats),
      searchTerm,
    );
    const total = Math.min(count ?? ranked.length, COURSE_SEARCH_FETCH_CAP);
    const paginated = ranked.slice(from, to + 1);

    return {
      items: paginated,
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  }

  query = query.order("code", { ascending: true }).range(from, to);
  const { data, error, count } = await query;

  if (error) {
    throw new DbError(error.message);
  }

  const total = count ?? 0;
  return {
    items: ((data ?? []) as CourseWithStatsRow[]).map(mapCourseWithStats),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

/** @deprecated Prefer listCoursesForAdminPage for paginated admin UI */
export async function listCoursesForAdmin(limit = 5000): Promise<CourseWithStats[]> {
  const result = await listCoursesForAdminPage({ page: 1, pageSize: limit });
  return result.items;
}

export async function getCourseByIdForAdmin(
  courseId: string,
): Promise<CourseWithStats | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCourseWithStats(data as CourseWithStatsRow);
}

export async function createCourse(input: {
  code: string;
  name: string;
  department: string;
  faculty?: string | null;
  level?: string | null;
  credits?: number | null;
  description?: string | null;
  objectives?: string | null;
  prerequisites?: string | null;
  teachingPattern?: string | null;
  semesterOffered?: string | null;
}): Promise<CourseWithStats> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      department: input.department,
      faculty: input.faculty ?? null,
      level: input.level ?? null,
      credits: input.credits ?? null,
      description: input.description ?? null,
      objectives: input.objectives ?? null,
      prerequisites: input.prerequisites ?? null,
      teaching_pattern: input.teachingPattern ?? null,
      semester_offered: input.semesterOffered ?? null,
      school_id: DEFAULT_SCHOOL_ID,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "创建课程失败");
  }

  return mapCourseWithStats(data as CourseWithStatsRow);
}

export async function updateCourse(
  courseId: string,
  input: {
    code: string;
    name: string;
    department: string;
    faculty?: string | null;
    level?: string | null;
    credits?: number | null;
    description?: string | null;
    objectives?: string | null;
    prerequisites?: string | null;
    teachingPattern?: string | null;
    semesterOffered?: string | null;
  },
): Promise<CourseWithStats> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .update({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      department: input.department,
      faculty: input.faculty ?? null,
      level: input.level ?? null,
      credits: input.credits ?? null,
      description: input.description ?? null,
      objectives: input.objectives ?? null,
      prerequisites: input.prerequisites ?? null,
      teaching_pattern: input.teachingPattern ?? null,
      semester_offered: input.semesterOffered ?? null,
    })
    .eq("id", courseId)
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "更新课程失败");
  }

  return mapCourseWithStats(data as CourseWithStatsRow);
}

export async function deleteCourse(courseId: string): Promise<{ code: string }> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .select("code")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("课程不存在或无法删除");
  }

  return { code: String(data.code) };
}
