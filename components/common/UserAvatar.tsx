import Image from "next/image";
import { DEFAULT_AVATAR_URL } from "@/constants/auth";
import { cn } from "@/lib/utils/cn";

const SIZE_CLASS = {
  xs: "h-6 w-6",
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-14 w-14",
} as const;

export type UserAvatarSize = keyof typeof SIZE_CLASS;

type UserAvatarProps = {
  src?: string | null;
  name?: string;
  size?: UserAvatarSize;
  className?: string;
};

export function UserAvatar({
  src,
  name,
  size = "md",
  className,
}: UserAvatarProps) {
  const avatarSrc = src?.trim() || DEFAULT_AVATAR_URL;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border",
        SIZE_CLASS[size],
        className,
      )}
    >
      <Image
        src={avatarSrc}
        alt={name ? `${name}的头像` : "用户头像"}
        fill
        className="object-cover"
        unoptimized
      />
    </span>
  );
}
