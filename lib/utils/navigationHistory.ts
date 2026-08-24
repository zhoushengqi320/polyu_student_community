import { MODULE_REGISTRY } from "@/constants/modules";
import { ROUTES } from "@/constants/routes";

const STACK_KEY = "polyuhub:nav-stack:v1";
const STACK_LIMIT = 40;

let lastSyncedPath: string | null = null;
/** 本次页面生命周期内的站内前进次数；刷新后归零，避免误用浏览器后退离开站点 */
let clientForwardCount = 0;

function readStack(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-STACK_LIMIT)));
}

export function locationKeyFrom(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname;
}

/** 在站点布局中于路径变化时调用，同步站内浏览栈。 */
export function syncNavigationHistory(fullPath: string): void {
  if (typeof window === "undefined" || lastSyncedPath === fullPath) {
    return;
  }

  const stack = readStack();
  const isBack = stack.length >= 2 && stack[stack.length - 2] === fullPath;

  if (isBack) {
    writeStack(stack.slice(0, -1));
    clientForwardCount = Math.max(0, clientForwardCount - 1);
  } else if (stack.at(-1) !== fullPath) {
    writeStack([...stack, fullPath]);
    if (lastSyncedPath !== null) {
      clientForwardCount += 1;
    }
  }

  lastSyncedPath = fullPath;
}

export function getPreviousPath(currentPath: string): string | null {
  const stack = readStack();
  const previousIndex = stack.at(-1) === currentPath ? stack.length - 2 : stack.length - 1;
  const previous = previousIndex >= 0 ? stack[previousIndex] : null;
  if (!previous || previous === currentPath) {
    return null;
  }
  return previous;
}

export function canUseHistoryBack(): boolean {
  return clientForwardCount > 0;
}

export function pageNameFromPath(fullPath: string): string {
  const pathname = fullPath.split("?")[0] || "/";

  if (pathname === ROUTES.home) {
    return "首页";
  }
  if (pathname === ROUTES.notifications || pathname.startsWith(`${ROUTES.notifications}/`)) {
    return "通知";
  }
  if (pathname.startsWith(ROUTES.messages.list)) {
    return "我的私信";
  }
  if (pathname === ROUTES.search() || pathname.startsWith("/search")) {
    return "搜索";
  }
  if (pathname.startsWith("/profile/")) {
    return "个人主页";
  }
  if (pathname === ROUTES.login) {
    return "登录";
  }
  if (pathname === ROUTES.signup) {
    return "注册";
  }
  if (pathname === ROUTES.forgotPassword) {
    return "忘记密码";
  }
  if (pathname === ROUTES.onboarding) {
    return "完善资料";
  }
  if (pathname === ROUTES.about.communityRules) {
    return "社区公约";
  }
  if (pathname === ROUTES.about.privacy) {
    return "隐私政策";
  }
  if (pathname === ROUTES.about.terms) {
    return "用户协议";
  }
  if (pathname === ROUTES.about.copyright) {
    return "版权说明";
  }

  if (pathname === ROUTES.forum.new) {
    return "发布帖子";
  }
  if (/^\/forum\/[^/]+\/edit$/.test(pathname)) {
    return "编辑帖子";
  }
  if (/^\/forum\/[^/]+$/.test(pathname)) {
    return "帖子详情";
  }
  if (pathname === ROUTES.food.new) {
    return "提交地点";
  }
  if (/^\/food\/[^/]+$/.test(pathname)) {
    return "地点详情";
  }
  if (pathname === ROUTES.market.new) {
    return "发布市集";
  }
  if (/^\/market\/[^/]+\/edit$/.test(pathname)) {
    return "编辑市集";
  }
  if (/^\/market\/[^/]+$/.test(pathname)) {
    return "市集详情";
  }
  if (pathname === ROUTES.feedback.new) {
    return "提交反馈";
  }
  if (/^\/feedback\/[^/]+$/.test(pathname)) {
    return "反馈详情";
  }
  if (/^\/courses\/[^/]+\/review$/.test(pathname)) {
    return "写评价";
  }
  if (/^\/courses\/[^/]+$/.test(pathname)) {
    return "课程详情";
  }
  if (/^\/study\/[^/]+$/.test(pathname)) {
    return "学习指南";
  }
  if (/^\/life\/[^/]+$/.test(pathname)) {
    return "生活指南";
  }
  if (/^\/guides\/[^/]+$/.test(pathname)) {
    return "入学攻略";
  }

  const modules = Object.values(MODULE_REGISTRY).sort(
    (a, b) => b.route.length - a.route.length,
  );
  for (const module of modules) {
    if (pathname === module.route || pathname.startsWith(`${module.route}/`)) {
      return module.label;
    }
  }

  return "上一级";
}
