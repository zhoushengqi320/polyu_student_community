import { ROUTES } from "@/constants/routes";

export const HOME_LIMITS = {
  featuredCourses: 6,
  latestReviews: 5,
  latestPosts: 5,
  featuredGuides: 4,
} as const;

export const QUICK_RESOURCE_TITLES = [
  "eStudent",
  "Learn@PolyU / Blackboard",
  "PolyU Library",
  "Academic Calendar",
  "Campus Map",
] as const;

export const HOME_HERO = {
  title: "PolyUHub",
  subtitle: "PolyU 学生自己的校园信息社区",
  description:
    "查课程评价、看入学攻略、找校园资源、参与 PolyU 学生讨论。",
  primaryCta: {
    label: "浏览课程评价",
    href: ROUTES.courses.list,
  },
  secondaryCta: {
    label: "查看新生攻略",
    href: ROUTES.guides.list,
  },
} as const;

export const HOME_DISCLAIMER =
  "PolyUHub 为学生自发建设的非官方社区平台，与香港理工大学官方无隶属关系。用户生成内容仅代表用户个人观点。";
