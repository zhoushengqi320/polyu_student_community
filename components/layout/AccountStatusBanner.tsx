import { getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/constants/routes";
import { formatDateTime } from "@/lib/utils/formatDate";
import { isBanned } from "@/lib/utils/permissions";
import Link from "next/link";

export async function AccountStatusBanner() {
  const user = await getSessionUser();

  if (!user || !isBanned(user)) {
    return null;
  }

  const bannedUntil = user.profile?.bannedUntil;
  const hasExpiry =
    bannedUntil && new Date(bannedUntil) > new Date();

  return (
    <div
      className="border-b border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
      role="status"
    >
      <div className="container flex flex-wrap items-center justify-between gap-2">
        <p>
          {hasExpiry ? (
            <>
              你的账号处于限制状态，暂时无法发帖、评论或点赞。限制至{" "}
              {formatDateTime(bannedUntil)}。
            </>
          ) : (
            <>你的账号处于限制状态，暂时无法发帖、评论或点赞。</>
          )}
        </p>
        <Link
          href={ROUTES.about.communityRules}
          className="shrink-0 font-medium underline underline-offset-2"
        >
          查看社区规则
        </Link>
      </div>
    </div>
  );
}
