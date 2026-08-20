import {
  MODULE_REGISTRY,
  PERMANENT_MODULES,
  SEASONAL_MODULES,
} from "@/constants/modules";
import { isFeatureEnabled } from "@/constants/features";

export const ROUTES = {
  home: "/",
  login: "/auth/login",
  signup: "/auth/signup",
  forgotPassword: "/auth/forgot-password",
  onboarding: "/onboarding",
  profile: (id: string) => `/profile/${id}`,
  notifications: "/notifications",
  admin: "/admin",
  adminCourses: (params?: { editCourseId?: string }) => {
    const search = new URLSearchParams({ tab: "courses" });
    if (params?.editCourseId) {
      search.set("editCourseId", params.editCourseId);
    }
    return `/admin?${search.toString()}`;
  },
  search: (q?: string, type?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    const query = params.toString();
    return query ? `/search?${query}` : "/search";
  },
  about: {
    privacy: "/about/privacy",
    terms: "/about/terms",
    copyright: "/about/copyright",
    communityRules: "/about/community-rules",
  },
  courses: {
    list: MODULE_REGISTRY.courses.route,
    detail: (courseCode: string) =>
      `/courses/${encodeURIComponent(courseCode)}`,
    review: (courseCode: string) =>
      `/courses/${encodeURIComponent(courseCode)}/review`,
  },
  food: {
    list: MODULE_REGISTRY.food.route,
    detail: (id: string) => `/food/${id}`,
    new: `${MODULE_REGISTRY.food.route}/new`,
  },
  study: {
    list: MODULE_REGISTRY.study.route,
    detail: (id: string) => `/study/${id}`,
  },
  life: {
    list: MODULE_REGISTRY.life.route,
    detail: (id: string) => `/life/${id}`,
  },
  forum: {
    list: MODULE_REGISTRY.forum.route,
    detail: (id: string) => `/forum/${id}`,
    new: `${MODULE_REGISTRY.forum.route}/new`,
    edit: (id: string) => `/forum/${id}/edit`,
  },
  feedback: {
    list: MODULE_REGISTRY.feedback.route,
    detail: (id: string) => `/feedback/${id}`,
    new: `${MODULE_REGISTRY.feedback.route}/new`,
  },
  guides: {
    list: MODULE_REGISTRY.guides.route,
    detail: (id: string) => `/guides/${id}`,
  },
} as const;

/** 顶栏 / 移动端导航：常驻模块 +（可选）开学季临时板块置右 */
export const NAV_ITEMS = isFeatureEnabled("seasonalGuides")
  ? [...PERMANENT_MODULES, ...SEASONAL_MODULES]
  : [...PERMANENT_MODULES];

export const AUTH_NAV_ITEMS = [
  { label: "理大邮箱登录", href: ROUTES.login },
] as const;
