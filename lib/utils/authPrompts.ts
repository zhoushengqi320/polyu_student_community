import { ROUTES } from "@/constants/routes";
import { type SessionUser } from "@/types/user";
import { can, canCreateInModule, isBanned } from "@/lib/utils/permissions";
import { type ModuleKey } from "@/types/common";

export function buildLoginHref(nextPath?: string): string {
  if (!nextPath) {
    return ROUTES.login;
  }

  return `${ROUTES.login}?next=${encodeURIComponent(nextPath)}`;
}

type CreateActionPrompt = {
  href: string;
  label: string;
};

/** 模块「创建/提交」类 CTA：区分未登录、封禁、待认证；有权限时返回 null */
export function getModuleCreatePrompt(
  user: SessionUser | null,
  moduleKey: ModuleKey,
  labels: {
    login: string;
    banned: string;
    unverified: string;
  },
  nextPath?: string,
): CreateActionPrompt | null {
  if (canCreateInModule(user, moduleKey)) {
    return null;
  }

  if (!user) {
    return {
      href: buildLoginHref(nextPath),
      label: labels.login,
    };
  }

  if (isBanned(user)) {
    return {
      href: ROUTES.profile(user.id),
      label: labels.banned,
    };
  }

  return {
    href: ROUTES.about.communityRules,
    label: labels.unverified,
  };
}

/** Server Action 层：互动/创建失败时的用户可见文案 */
export function getPermissionDeniedMessage(
  user: SessionUser | null,
  permissionLabel: string,
): string {
  if (!user) {
    return `请先登录后再${permissionLabel}`;
  }

  if (isBanned(user)) {
    return `当前账号处于限制状态，暂时无法${permissionLabel}`;
  }

  return `当前账号暂无权限${permissionLabel}`;
}

/** 是否具备指定互动权限（点赞/评论等） */
export function canInteract(user: SessionUser | null): boolean {
  return can(user, "interaction:like");
}

export function getInteractionDeniedMessage(
  user: SessionUser | null,
  actionLabel: string,
): string {
  return getPermissionDeniedMessage(user, actionLabel);
}

export function getCourseReviewPrompt(
  user: SessionUser | null,
  courseCode: string,
): { href: string; label: string; canReview: boolean } {
  const reviewPath = ROUTES.courses.review(courseCode);

  if (canCreateInModule(user, "courses")) {
    return {
      href: reviewPath,
      label: "写评价",
      canReview: true,
    };
  }

  const prompt = getModuleCreatePrompt(
    user,
    "courses",
    {
      login: "登录后评价",
      banned: "账号受限",
      unverified: "认证后评价",
    },
    reviewPath,
  );

  return {
    href: prompt?.href ?? ROUTES.login,
    label: prompt?.label ?? "登录后评价",
    canReview: false,
  };
}
