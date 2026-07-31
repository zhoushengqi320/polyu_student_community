"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { type AdminActionState } from "@/lib/admin/state";
import { createCourse, updateCourse } from "@/lib/db/courses";
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
