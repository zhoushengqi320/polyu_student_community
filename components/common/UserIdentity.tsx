import Link from "next/link";
import { AdminRoleBadge } from "@/components/common/AdminRoleBadge";
import {
  UserAvatar,
  type UserAvatarSize,
} from "@/components/common/UserAvatar";
import { USER_ROLES, type UserRole } from "@/constants/userRoles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";

type UserIdentityProps = {
  userId?: string;
  name: string;
  avatarUrl?: string | null;
  role?: UserRole | string | null;
  size?: UserAvatarSize;
  className?: string;
  nameClassName?: string;
  /**
   * 当外层已经用 Link 整卡可点击时，避免渲染嵌套 <a>（导致 hydration error）。
   */
  disableLink?: boolean;
};

export function UserIdentity({
  userId,
  name,
  avatarUrl,
  role,
  size = "sm",
  className,
  nameClassName,
  disableLink = false,
}: UserIdentityProps) {
  const showAdminBadge = role === USER_ROLES.admin;

  const identity = (
    <>
      <UserAvatar src={avatarUrl} name={name} size={size} />
      <span className={cn("truncate font-medium", nameClassName)}>{name}</span>
      {showAdminBadge ? <AdminRoleBadge /> : null}
    </>
  );

  const baseClass = cn("inline-flex min-w-0 max-w-full items-center gap-2", className);

  if (userId && !disableLink) {
    return (
      <Link
        href={ROUTES.profile(userId)}
        className={cn(baseClass, "text-foreground hover:text-primary")}
      >
        {identity}
      </Link>
    );
  }

  return <span className={baseClass}>{identity}</span>;
}
