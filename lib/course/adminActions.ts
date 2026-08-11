"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { type AdminActionState } from "@/lib/admin/state";
import { createCourse, deleteCourse, getCourseByIdForAdmin, listCoursesForAdminPage, updateCourse } from "@/lib/db/courses";
import { logAdminAction } from "@/lib/db/reports";
import { DbError } from "@/lib/db/shared";
import { courseAdminSchema } from "@/lib/validations/courseAdminSchema";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES } from "@/constants/reportReasons";

export type CourseAdminFormState = AdminActionState & {
  fieldErrors?: Record<string, string>;
};

function readCourseForm(formData: FormData) {
  return {
    code: formData.get("code"),
    name: formData.get("name"),
    department: formData.get("department"),
    faculty: formData.get("faculty"),
    level: formData.get("level"),
    credits: formData.get("credits"),
    description: formData.get("description"),
    objectives: formData.get("objectives"),
    prerequisites: formData.get("prerequisites"),
    teachingPattern: formData.get("teachingPattern"),
    semesterOffered: formData.get("semesterOffered"),
  };
}

export async function createCourseAdminAction(
  _prevState: CourseAdminFormState,
  formData: FormData,
): Promise<CourseAdminFormState> {
  const admin = await requireAdmin();
  const parsed = courseAdminSchema.safeParse(readCourseForm(formData));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    return { fieldErrors, error: "请检查课程信息" };
  }

  try {
    const course = await createCourse(parsed.data);
    await logAdminAction({
      adminId: admin.id,
      action: "create_course",
      targetType: TARGET_TYPES.course,
      targetId: course.id,
      metadata: { code: course.code },
    });
    revalidatePath(ROUTES.admin);
    revalidatePath(ROUTES.courses.list);
    return { success: `课程 ${course.code} 已创建` };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "创建课程失败",
    };
  }
}

export async function updateCourseAdminAction(
  courseId: string,
  _prevState: CourseAdminFormState,
  formData: FormData,
): Promise<CourseAdminFormState> {
  const admin = await requireAdmin();
  const parsed = courseAdminSchema.safeParse(readCourseForm(formData));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    return { fieldErrors, error: "请检查课程信息" };
  }

  try {
    const course = await updateCourse(courseId, parsed.data);
    await logAdminAction({
      adminId: admin.id,
      action: "update_course",
      targetType: TARGET_TYPES.course,
      targetId: course.id,
      metadata: { code: course.code },
    });
    revalidatePath(ROUTES.admin);
    revalidatePath(ROUTES.courses.list);
    revalidatePath(ROUTES.courses.detail(course.code));
    return { success: `课程 ${course.code} 已更新` };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "更新课程失败",
    };
  }
}

export async function deleteCourseAdminAction(
  courseId: string,
): Promise<CourseAdminFormState> {
  const admin = await requireAdmin();

  try {
    const deleted = await deleteCourse(courseId);
    await logAdminAction({
      adminId: admin.id,
      action: "delete_course",
      targetType: TARGET_TYPES.course,
      targetId: courseId,
      metadata: { code: deleted.code },
    });
    revalidatePath(ROUTES.admin);
    revalidatePath(ROUTES.courses.list);
    return { success: `课程 ${deleted.code} 已删除` };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "删除课程失败",
    };
  }
}

export async function listCoursesAdminAction(input: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  await requireAdmin();
  try {
    return {
      success: true as const,
      data: await listCoursesForAdminPage(input),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof DbError ? error.message : "加载课程列表失败",
      data: {
        items: [],
        total: 0,
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        totalPages: 0,
      },
    };
  }
}

export async function getCourseAdminAction(courseId: string) {
  await requireAdmin();
  try {
    const course = await getCourseByIdForAdmin(courseId);
    if (!course) {
      return { success: false as const, error: "课程不存在", course: null };
    }
    return { success: true as const, course };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof DbError ? error.message : "加载课程失败",
      course: null,
    };
  }
}
