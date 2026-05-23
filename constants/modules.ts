import { type ModuleKey } from "@/types/common";

export const MODULE_ICON_NAMES = [
  "BookOpen",
  "GraduationCap",
  "UtensilsCrossed",
  "Globe",
  "Users",
  "MessageSquare",
] as const;

export type ModuleIconName = (typeof MODULE_ICON_NAMES)[number];

export const MODULE_REGISTRY = {
  courses: {
    key: "courses" as const,
    route: "/courses",
    label: "课程评价",
    description: "查看课程评分、难度与真实评价",
    requiresVerification: true,
    icon: "BookOpen",
  },
  guides: {
    key: "guides" as const,
    route: "/guides",
    label: "入学攻略",
    description: "新生入学、选科、生活实用指南",
    requiresVerification: true,
    icon: "GraduationCap",
  },
  food: {
    key: "food" as const,
    route: "/food",
    label: "美食推荐",
    description: "校园周边与香港美食分享",
    requiresVerification: false,
    icon: "UtensilsCrossed",
  },
  resources: {
    key: "resources" as const,
    route: "/resources",
    label: "常用网站",
    description: "理工大学常用网站与工具导航",
    requiresVerification: false,
    icon: "Globe",
  },
  buddy: {
    key: "buddy" as const,
    route: "/buddy",
    label: "找搭子",
    description: "学习、运动、活动组队",
    requiresVerification: true,
    icon: "Users",
  },
  forum: {
    key: "forum" as const,
    route: "/forum",
    label: "自由讨论区",
    description: "校园生活、学习经验自由交流",
    requiresVerification: true,
    icon: "MessageSquare",
  },
} as const satisfies Record<
  ModuleKey,
  {
    key: ModuleKey;
    route: string;
    label: string;
    description: string;
    requiresVerification: boolean;
    icon: ModuleIconName;
  }
>;

export const CORE_MODULES = Object.values(MODULE_REGISTRY);

export function getModuleByKey(key: ModuleKey) {
  return MODULE_REGISTRY[key];
}
