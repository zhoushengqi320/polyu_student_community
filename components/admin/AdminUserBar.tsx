import { UserAvatar } from "@/components/common/UserAvatar";
import { type SessionUser } from "@/types/user";

type AdminUserBarProps = {
  user: SessionUser;
};

export function AdminUserBar({ user }: AdminUserBarProps) {
  const displayName = user.profile?.displayName ?? "管理员";

  return (
    <div className="border-b bg-muted/40">
      <div className="container flex items-center justify-between gap-3 py-3">
        <p className="text-sm font-semibold">PolyUHub 管理后台</p>
        <div className="flex items-center gap-2.5 text-sm">
          <UserAvatar
            src={user.profile?.avatarUrl}
            name={displayName}
            size="sm"
          />
          <span className="font-medium">{displayName}</span>
        </div>
      </div>
    </div>
  );
}
