import { type ContentStatus } from "@/constants/contentStatus";
import { type CourseDepartmentId, type CourseSemesterId } from "@/constants/courseOptions";
import { type ProfileListItem } from "@/types/user";

export type Course = {
  id: string;
  code: string;
  name: string;
  department: CourseDepartmentId;
  credits: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CourseReview = {
  id: string;
  courseId: string;
  userId: string;
  semester: CourseSemesterId;
  overallRating: number;
  difficultyRating: number;
  workloadRating: number;
  gradingRating: number;
  teachingRating: number;
  content: string;
  status: ContentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CourseWithStats = Course & {
  reviewCount: number;
  averageRating: number | null;
};

export type CourseReviewWithAuthor = CourseReview & {
  author: ProfileListItem;
};

export type CourseDetail = CourseWithStats & {
  reviews: CourseReviewWithAuthor[];
};

export type CourseFilters = {
  search?: string;
  department?: CourseDepartmentId;
  page?: number;
  pageSize?: number;
};
