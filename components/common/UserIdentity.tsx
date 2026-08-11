import Link from "next/link";
import {
  UserAvatar,
  type UserAvatarSize,
} from "@/components/common/UserAvatar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";

type UserIdentityProps = {
  userId?: string;
  name: string;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
  nameClassName?: string;
};

export function UserIdentity({
  userId,
  name,
  avatarUrl,
  size = "sm",
  className,
  nameClassName,
}: UserIdentityProps) {
  const identity = (
    <>
      <UserAvatar src={avatarUrl} name={name} size={size} />
      <span className={cn("truncate font-medium", nameClassName)}>{name}</span>
    </>
  );

  const baseClass = cn("inline-flex min-w-0 max-w-full items-center gap-2", className);

  if (userId) {
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
