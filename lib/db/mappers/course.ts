import { type ContentStatus } from "@/constants/contentStatus";
import { type CourseAttendanceId, type CourseSemesterId } from "@/constants/courseOptions";
import { mapProfileListItem, type ProfileRow } from "@/lib/db/mappers/profile";
import { type Database, type Json } from "@/types/database";
import {
  type Course,
  type CourseAssessment,
  type CourseAssessmentItem,
  type CourseReview,
  type CourseReviewStats,
  type CourseReviewWithAuthor,
  type CourseWithStats,
} from "@/types/course";

export type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
export type CourseReviewRow =
  Database["public"]["Tables"]["course_reviews"]["Row"];

export type CourseReviewWithProfileRow = CourseReviewRow & {
  profiles: ProfileRow;
};

type CourseStatsRow = {
  review_count?: number | null;
  overall_rating?: number | null;
  difficulty_rating?: number | null;
  top_tags?: Json;
};

export type CourseWithStatsRow = CourseRow & CourseStatsRow;

function readText(value: Json | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readAssessmentItems(value: Json | undefined): CourseAssessmentItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const label = readText(item.label);
      if (!label) {
        return null;
      }

      return {
        label,
        value: readText(item.value),
      };
    })
    .filter((item): item is CourseAssessmentItem => item !== null);
}

function readTopTags(value: Json | undefined): Array<{ tag: string; count: number }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const tag = readText(item.tag);
      const count = typeof item.count === "number" ? item.count : Number(item.count);
      if (!tag || Number.isNaN(count)) {
        return null;
      }

      return { tag, count };
    })
    .filter((item): item is { tag: string; count: number } => item !== null);
}

function mapAssessment(value: Json): CourseAssessment {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return {
    items: readAssessmentItems(value.items),
    originalText: readText(value.original_text),
    assignment: readText(value.assignment),
    quiz: readText(value.quiz),
    midterm: readText(value.midterm),
    finalExam: readText(value.final_exam),
    project: readText(value.project),
    presentation: readText(value.presentation),
    other: readText(value.other),
  };
}

export function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    department: row.department,
    faculty: row.faculty,
    level: row.level,
    credits: row.credits,
    description: row.description,
    objectives: row.objectives,
    prerequisites: row.prerequisites,
    teachingPattern: row.teaching_pattern,
    semesterOffered: row.semester_offered,
    assessment: mapAssessment(row.assessment_json),
    pdfUrl: row.pdf_url,
    pdfStoragePath: row.pdf_storage_path,
    sourceFileName: row.source_file_name,
    sourceUpdatedAt: row.source_updated_at,
    schoolId: row.school_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCourseReview(row: CourseReviewRow): CourseReview {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    semester: row.semester as CourseSemesterId,
    teacherName: row.teacher_name,
    overallRating: row.overall_rating,
    difficultyRating: row.difficulty_rating,
    workloadRating: row.workload_rating,
    gradingRating: row.grading_rating,
    examDifficulty: row.exam_difficulty,
    teachingRating: row.teaching_rating,
    examType: row.exam_type,
    assignmentType: row.assignment_type,
    attendanceRequired: row.attendance_required,
    reviewText: row.review_text ?? row.content,
    tips: row.tips,
    isAnonymous: row.is_anonymous,
    tags: row.tags ?? [],
    usefulCount: 0,
    isMarkedUseful: false,
    status: row.status as ContentStatus,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCourseReviewWithAuthor(
  row: CourseReviewWithProfileRow,
): CourseReviewWithAuthor {
  const review = mapCourseReview(row);

  return {
    ...review,
    author: review.isAnonymous
      ? {
          id: row.user_id,
          username: "anonymous",
          displayName: "匿名用户",
          avatarUrl: null,
          role: "user",
        }
      : mapProfileListItem(row.profiles),
  };
}

export function mapCourseStats(row: CourseStatsRow): CourseReviewStats {
  return {
    reviewCount: row.review_count ?? 0,
    averageOverallRating: row.overall_rating ?? null,
    averageDifficultyRating: row.difficulty_rating ?? null,
    commonTags: readTopTags(row.top_tags),
  };
}

export function mapCourseWithStats(row: CourseWithStatsRow): CourseWithStats {
  return {
    ...mapCourse(row),
    ...mapCourseStats(row),
  };
}
