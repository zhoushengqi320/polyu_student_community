import { ROUTES } from "@/constants/routes";

export const HOME_LIMITS = {
  featuredCourses: 6,
  latestReviews: 5,
  latestPosts: 5,
  featuredGuides: 4,
} as const;

export const HOME_HERO = {
  title: "PolyUHub",
  subtitle: "PolyU 学生自己的校园信息社区",
  description:
    "查课程评价、看学习与生活指南、在讨论区找搭子与交流。选课前，先查 PolyUHub。",
  primaryCta: {
    label: "浏览课程评价",
    href: ROUTES.courses.list,
  },
  writeReviewCta: {
    label: "写课程评价",
    href: ROUTES.courses.list,
  },
  secondaryCta: {
    label: "查看学习指南",
    href: ROUTES.study.list,
  },
  seasonalCta: {
    label: "查看新生攻略",
    href: ROUTES.guides.list,
  },
} as const;

export const HOME_VALUE_POINTS = [
  {
    title: "选课前先查评价",
    description: "难度、工作量、给分与考试体验，帮你避开踩坑、选到合适的课。",
  },
  {
    title: "校园信息一站查",
    description: "学习指南、生活指南与开学攻略整理成文，少翻群聊、少问来问去。",
  },
  {
    title: "同学真实讨论",
    description: "自由讨论区交流求助，用「找搭子」话题组队学习、约饭、运动或项目。",
  },
] as const;

export const HOME_DISCLAIMER =
  "PolyUHub 为学生自发建设的非官方社区平台，与香港理工大学官方无隶属关系。用户生成内容仅代表用户个人观点。";
