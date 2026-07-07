import { type ContentStatus } from "@/constants/contentStatus";
import {
  type CourseAssignmentTypeId,
  type CourseAttendanceId,
  type CourseDepartmentId,
  type CourseExamTypeId,
  type CourseReviewTag,
  type CourseSemesterId,
  type CourseSortId,
} from "@/constants/courseOptions";
import { type ProfileListItem } from "@/types/user";

export type CourseAssessmentItem = {
  label: string;
  value: string | null;
};

export type CourseAssessment = {
  items?: CourseAssessmentItem[];
  originalText?: string | null;
  assignment?: string | null;
  quiz?: string | null;
  midterm?: string | null;
  finalExam?: string | null;
  project?: string | null;
  presentation?: string | null;
  other?: string | null;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  department: CourseDepartmentId | string;
  faculty: string | null;
  level: string | null;
  credits: number | null;
  description: string | null;
  objectives: string | null;
  prerequisites: string | null;
  teachingPattern: string | null;
  semesterOffered: string | null;
  assessment: CourseAssessment;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  sourceFileName: string | null;
  sourceUpdatedAt: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
};

export type CourseReview = {
  id: string;
  courseId: string;
  userId: string;
  semester: CourseSemesterId;
  teacherName: string | null;
  overallRating: number;
  difficultyRating: number;
  workloadRating: number | null;
  gradingRating: number | null;
  examDifficulty: number | null;
  teachingRating: number | null;
  examType: CourseExamTypeId | string | null;
  assignmentType: CourseAssignmentTypeId | string | null;
  attendanceRequired: CourseAttendanceId | string | null;
  reviewText: string;
  tips: string | null;
  isAnonymous: boolean;
  tags: CourseReviewTag[] | string[];
  usefulCount: number;
  isMarkedUseful: boolean;
  status: ContentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CourseWithStats = Course & {
  reviewCount: number;
  averageOverallRating: number | null;
  averageDifficultyRating: number | null;
  commonTags: Array<{ tag: string; count: number }>;
};

export type CourseReviewWithAuthor = CourseReview & {
  author: ProfileListItem;
};

export type CourseDetail = CourseWithStats & {
  reviews: CourseReviewWithAuthor[];
};

export type CourseReviewStats = Pick<
  CourseWithStats,
  | "reviewCount"
  | "averageOverallRating"
  | "averageDifficultyRating"
  | "commonTags"
>;

export type CourseFilters = {
  search?: string;
  department?: CourseDepartmentId | string;
  faculty?: string;
  sort?: CourseSortId;
  page?: number;
  pageSize?: number;
};

export type CreateCourseReviewInput = {
  courseId: string;
  userId: string;
  overallRating: number;
  difficultyRating: number;
  reviewText: string;
  isAnonymous: boolean;
  tags: CourseReviewTag[] | string[];
};
