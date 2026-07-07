"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { createCourseReview, getCourseByCode } from "@/lib/db/courses";
import { DbError } from "@/lib/db/shared";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { assertCan } from "@/lib/utils/permissions";
import { courseReviewSchema } from "@/lib/validations/courseReviewSchema";

export type CourseReviewFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "overallRating"
      | "difficultyRating"
      | "tags"
      | "reviewText"
      | "isAnonymous",
      string
    >
  >;
};

export async function createCourseReviewAction(
  courseCode: string,
  _prevState: CourseReviewFormState,
  formData: FormData,
): Promise<CourseReviewFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置，无法发布课程评价。" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:course_review");
  } catch {
    return { error: "需要理大认证用户才能发布课程评价" };
  }

  if (!user) {
    return { error: "请先登录" };
  }

  const course = await getCourseByCode(courseCode);
  if (!course) {
    return { error: "课程不存在" };
  }

  const parsed = courseReviewSchema.safeParse({
    courseId: course.id,
    overallRating: formData.get("overallRating"),
    difficultyRating: formData.get("difficultyRating"),
    tags: formData.getAll("tags"),
    reviewText: formData.get("reviewText"),
    isAnonymous: formData.getAll("isAnonymous").includes("true") ? "true" : "false",
  });

  if (!parsed.success) {
    const fieldErrors: CourseReviewFormState["fieldErrors"] = {};
    const messages: string[] = [];

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && field in parsed.error.flatten().fieldErrors) {
        fieldErrors[field as keyof NonNullable<CourseReviewFormState["fieldErrors"]>] =
          issue.message;
      }
      messages.push(issue.message);
    }

    return {
      fieldErrors,
      error: messages.length > 0 ? messages.join("；") : "请检查评价内容",
    };
  }

  try {
    await createCourseReview({
      courseId: course.id,
      userId: user.id,
      overallRating: parsed.data.overallRating,
      difficultyRating: parsed.data.difficultyRating,
      reviewText: parsed.data.reviewText,
      isAnonymous: parsed.data.isAnonymous,
      tags: parsed.data.tags,
    });

    revalidatePath(ROUTES.courses.list);
    revalidatePath(ROUTES.courses.detail(course.code));
    redirect(ROUTES.courses.detail(course.code));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof DbError) {
      return { error: error.message };
    }

    return { error: "发布课程评价失败，请稍后重试" };
  }
}
