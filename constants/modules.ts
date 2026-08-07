import { type ModuleKey } from "@/types/common";

export const MODULE_ICON_NAMES = [
  "BookOpen",
  "GraduationCap",
  "UtensilsCrossed",
  "NotebookPen",
  "House",
  "MessageSquare",
] as const;

export type ModuleIconName = (typeof MODULE_ICON_NAMES)[number];

type ModuleConfig = {
  key: ModuleKey;
  route: string;
  label: string;
  description: string;
  requiresVerification: boolean;
  icon: ModuleIconName;
  /** 开学季临时入口；关闭 FEATURES.seasonalGuides 后不出现在导航 */
  seasonal?: boolean;
};

export const MODULE_REGISTRY = {
  courses: {
    key: "courses" as const,
    route: "/courses",
    label: "课程评价",
    description: "查看课程评分、难度与真实评价",
    requiresVerification: true,
    icon: "BookOpen",
  },
  food: {
    key: "food" as const,
    route: "/food",
    label: "吃喝玩乐",
    description: "校园周边美食、休闲与玩乐推荐",
    requiresVerification: false,
    icon: "UtensilsCrossed",
  },
  study: {
    key: "study" as const,
    route: "/study",
    label: "学习指南",
    description: "选课策略、常用官网、GPA、考试与学术规范",
    requiresVerification: true,
    icon: "NotebookPen",
  },
  life: {
    key: "life" as const,
    route: "/life",
    label: "生活指南",
    description: "电话卡、银行、八达通、医疗、交通与日常适应",
    requiresVerification: true,
    icon: "House",
  },
  forum: {
    key: "forum" as const,
    route: "/forum",
    label: "自由讨论区",
    description: "课程求助、校园生活、找搭子等自由交流",
    requiresVerification: true,
    icon: "MessageSquare",
  },
  guides: {
    key: "guides" as const,
    route: "/guides",
    label: "入学攻略",
    description: "开学季专题：行前准备、抵港、注册与住宿指引",
    requiresVerification: true,
    icon: "GraduationCap",
    seasonal: true,
  },
} as const satisfies Record<ModuleKey, ModuleConfig>;

/** 常驻模块（导航与首页主网格），不含开学季临时板块 */
export const PERMANENT_MODULES = [
  MODULE_REGISTRY.courses,
  MODULE_REGISTRY.food,
  MODULE_REGISTRY.study,
  MODULE_REGISTRY.life,
  MODULE_REGISTRY.forum,
] as const;

/** 开学季临时板块；默认置于导航最右侧 */
export const SEASONAL_MODULES = [MODULE_REGISTRY.guides] as const;

/** @deprecated 请优先使用 PERMANENT_MODULES / getNavModules */
export const CORE_MODULES = PERMANENT_MODULES;

export function getModuleByKey(key: ModuleKey) {
  return MODULE_REGISTRY[key];
}
