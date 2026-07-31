import { type CourseWithStats } from "@/types/course";
import { type ForumPostListItem } from "@/types/forum";
import { type GuideListItem } from "@/types/guide";

export type HomeSectionResult<T> = {
  items: T[];
  error?: boolean;
};

export type HomeLatestCourseReview = {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  overallRating: number;
  difficultyRating: number;
  tags: string[];
  createdAt: string;
};

export type HomePageData = {
  featuredCourses: HomeSectionResult<CourseWithStats>;
  latestReviews: HomeSectionResult<HomeLatestCourseReview>;
  latestPosts: HomeSectionResult<ForumPostListItem>;
  featuredGuides: HomeSectionResult<GuideListItem>;
  isDatabaseConfigured: boolean;
};
