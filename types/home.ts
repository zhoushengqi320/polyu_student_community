import { type CourseWithStats } from "@/types/course";
import { type ForumPostListItem } from "@/types/forum";
import { type GuideListItem } from "@/types/guide";
import { type Resource } from "@/types/resource";

export type HomeSectionResult<T> = {
  items: T[];
  error?: boolean;
};

export type HomeQuickResource = Pick<
  Resource,
  "id" | "title" | "description" | "url"
>;

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
  quickResources: HomeSectionResult<HomeQuickResource>;
  isDatabaseConfigured: boolean;
};
