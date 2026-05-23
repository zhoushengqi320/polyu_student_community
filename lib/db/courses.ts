import { type CourseFilters, type CourseWithStats } from "@/types/course";
import { type PaginatedResult } from "@/types/common";
import { toPaginatedResult, getPagination } from "@/lib/db/shared";

// TODO: 接入 Supabase 后替换占位实现
export async function listCourses(
  filters: CourseFilters = {},
): Promise<PaginatedResult<CourseWithStats>> {
  const { page = 1, pageSize = 20 } = filters;
  const pagination = getPagination(page, pageSize);

  return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
}

export async function getCourseByCode(_courseCode: string) {
  return null;
}

export async function listCourseReviews(_courseId: string) {
  return [];
}

export async function createCourseReview(_input: unknown) {
    throw new Error("功能尚未开放，请先配置数据库");
}
