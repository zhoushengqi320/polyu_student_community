"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  buildCourseSemesterValue,
  type CourseSemesterId,
} from "@/constants/courseOptions";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { createCourseReview, getCourseByCode, softDeleteCourseReview } from "@/lib/db/courses";
import { DbError } from "@/lib/db/shared";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { assertCan, isAdmin } from "@/lib/utils/permissions";
import { courseReviewSchema } from "@/lib/validations/courseReviewSchema";

export type CourseReviewFormValuesState = {
  academicYear: string;
  semesterTerm: string;
  teacherName: string;
  overallRating: string;
  difficultyRating: string;
  workloadRating: string;
  gradingRating: string;
  teachingRating: string;
  examDifficulty: string;
  examTypes: string[];
  examTypeOther: string;
  assignmentTypes: string[];
  attendanceRequired: string;
  tags: string[];
  reviewText: string;
  isAnonymous: boolean;
};

export type CourseReviewFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "academicYear"
      | "semesterTerm"
      | "teacherName"
      | "overallRating"
      | "difficultyRating"
      | "workloadRating"
      | "gradingRating"
      | "teachingRating"
      | "examDifficulty"
      | "examType"
      | "examTypeOther"
      | "assignmentType"
      | "attendanceRequired"
      | "tags"
      | "reviewText"
      | "isAnonymous",
      string
    >
  >;
  /** 提交失败时回传，避免表单被清空 */
  values?: CourseReviewFormValuesState;
};

function readFormValues(formData: FormData): CourseReviewFormValuesState {
  return {
    academicYear: String(formData.get("academicYear") ?? ""),
    semesterTerm: String(formData.get("semesterTerm") ?? ""),
    teacherName: String(formData.get("teacherName") ?? ""),
    overallRating: String(formData.get("overallRating") ?? ""),
    difficultyRating: String(formData.get("difficultyRating") ?? ""),
    workloadRating: String(formData.get("workloadRating") ?? ""),
    gradingRating: String(formData.get("gradingRating") ?? ""),
    teachingRating: String(formData.get("teachingRating") ?? ""),
    examDifficulty: String(formData.get("examDifficulty") ?? ""),
    examTypes: formData.getAll("examTypes").map(String),
    examTypeOther: String(formData.get("examTypeOther") ?? ""),
    assignmentTypes: formData.getAll("assignmentTypes").map(String),
    attendanceRequired: String(formData.get("attendanceRequired") ?? ""),
    tags: formData.getAll("tags").map(String),
    reviewText: String(formData.get("reviewText") ?? ""),
    isAnonymous: formData.getAll("isAnonymous").includes("true"),
  };
}

export async function createCourseReviewAction(
  courseCode: string,
  _prevState: CourseReviewFormState,
  formData: FormData,
): Promise<CourseReviewFormState> {
  const values = readFormValues(formData);

  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置，无法发布课程评价。", values };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:course_review");
  } catch {
    return { error: "需要理大认证用户才能发布课程评价", values };
  }

  if (!user) {
    return { error: "请先登录", values };
  }

  const course = await getCourseByCode(courseCode);
  if (!course) {
    return { error: "课程不存在", values };
  }

  const parsed = courseReviewSchema.safeParse({
    courseId: course.id,
    academicYear: values.academicYear,
    semesterTerm: values.semesterTerm,
    teacherName: values.teacherName,
    overallRating: values.overallRating,
    difficultyRating: values.difficultyRating,
    workloadRating: values.workloadRating,
    gradingRating: values.gradingRating,
    teachingRating: values.teachingRating,
    examDifficulty: values.examDifficulty,
    examTypes: values.examTypes,
    examTypeOther: values.examTypeOther,
    assignmentType: values.assignmentTypes,
    attendanceRequired: values.attendanceRequired,
    tags: values.tags,
    reviewText: values.reviewText,
    isAnonymous: values.isAnonymous ? "true" : "false",
  });

  if (!parsed.success) {
    const fieldErrors: CourseReviewFormState["fieldErrors"] = {};
    const messages: string[] = [];

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        typeof field === "string" &&
        field in parsed.error.flatten().fieldErrors
      ) {
        fieldErrors[
          field as keyof NonNullable<CourseReviewFormState["fieldErrors"]>
        ] = issue.message;
      }
      messages.push(issue.message);
    }

    return {
      fieldErrors,
      error: messages.length > 0 ? messages.join("；") : "请检查评价内容",
      values,
    };
  }

  try {
    await createCourseReview({
      courseId: course.id,
      userId: user.id,
      semester: buildCourseSemesterValue(
        parsed.data.academicYear,
        parsed.data.semesterTerm as CourseSemesterId,
      ),
      teacherName: parsed.data.teacherName,
      overallRating: parsed.data.overallRating,
      difficultyRating: parsed.data.difficultyRating,
      workloadRating: parsed.data.workloadRating,
      gradingRating: parsed.data.gradingRating,
      teachingRating: parsed.data.teachingRating,
      examDifficulty: parsed.data.examDifficulty,
      examType: parsed.data.examType,
      assignmentType: parsed.data.assignmentType,
      attendanceRequired: parsed.data.attendanceRequired,
      reviewText: parsed.data.reviewText,
      tips: null,
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
      return { error: error.message, values };
    }

    return { error: "发布课程评价失败，请稍后重试", values };
  }
}

export type DeleteCourseReviewState = {
  error?: string;
};

export async function deleteOwnCourseReviewAction(
  reviewId: string,
  courseCode: string,
  _prevState: DeleteCourseReviewState,
  _formData: FormData,
): Promise<DeleteCourseReviewState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  try {
    await softDeleteCourseReview(reviewId, user.id, {
      allowAdmin: isAdmin(user),
    });
    revalidatePath(ROUTES.courses.detail(courseCode));
    revalidatePath(ROUTES.courses.list);
    return {};
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "删除失败，请稍后重试",
    };
  }
}
