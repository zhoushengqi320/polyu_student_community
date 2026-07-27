import { MODULE_REGISTRY } from "@/constants/modules";

export const ROUTES = {
  home: "/",
  search: (query?: string) =>
    query?.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search",
  login: "/auth/login",
  signup: "/auth/login",
  onboarding: "/onboarding",
  profile: (id: string) => `/profile/${id}`,
  admin: "/admin",
  courses: {
    list: MODULE_REGISTRY.courses.route,
    detail: (courseCode: string) => `/courses/${courseCode}`,
    review: (courseCode: string) => `/courses/${courseCode}/review`,
  },
  guides: {
    list: MODULE_REGISTRY.guides.route,
    detail: (id: string) => `/guides/${id}`,
  },
  food: {
    list: MODULE_REGISTRY.food.route,
    detail: (id: string) => `/food/${id}`,
  },
  resources: {
    list: MODULE_REGISTRY.resources.route,
  },
  buddy: {
    list: MODULE_REGISTRY.buddy.route,
    detail: (id: string) => `/buddy/${id}`,
  },
  forum: {
    list: MODULE_REGISTRY.forum.route,
    detail: (id: string) => `/forum/${id}`,
    new: `${MODULE_REGISTRY.forum.route}/new`,
  },
} as const;

export const NAV_ITEMS = [
  MODULE_REGISTRY.courses,
  MODULE_REGISTRY.guides,
  MODULE_REGISTRY.food,
  MODULE_REGISTRY.resources,
  MODULE_REGISTRY.buddy,
  MODULE_REGISTRY.forum,
] as const;

export const AUTH_NAV_ITEMS = [
  { label: "理大邮箱登录", href: ROUTES.login },
] as const;
