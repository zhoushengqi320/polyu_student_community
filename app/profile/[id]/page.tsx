import Link from "next/link";
import { notFound } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { TagBadge } from "@/components/common/TagBadge";
import { ProfileFavoritesSection } from "@/components/profile/ProfileFavoritesSection";
import { getSessionUser } from "@/lib/auth/session";
import { getUserFavorites } from "@/lib/db/favorites";
import { getProfileById } from "@/lib/db/profiles";
import { ROUTES } from "@/constants/routes";
import { USER_ROLE_LABELS } from "@/constants/userRoles";
import { getStudentGradeLabel } from "@/constants/profileOptions";
import { formatDate } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  const profile = await getProfileById(id);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = sessionUser?.id === id;
  const favorites = isOwnProfile ? await getUserFavorites(id) : null;

  return (
    <ModulePageShell
      title={profile.displayName ?? profile.username}
      description={`@${profile.username}`}
      actions={
        isOwnProfile && !profile.onboardingCompleted ? (
          <Button variant="outline" asChild>
            <Link href={ROUTES.onboarding}>完善资料</Link>
          </Button>
        ) : null
      }
    >
      <div className="space-y-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{profile.displayName ?? profile.username}</CardTitle>
              <TagBadge label={USER_ROLE_LABELS[profile.role]} />
            </div>
            <CardDescription>@{profile.username}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.bio ? <p>{profile.bio}</p> : null}
            {profile.grade ? (
              <p className="text-muted-foreground">
                年级：{getStudentGradeLabel(profile.grade)}
              </p>
            ) : null}
            {profile.major ? (
              <p className="text-muted-foreground">专业：{profile.major}</p>
            ) : null}
            <p className="text-muted-foreground">
              加入时间：{formatDate(profile.createdAt)}
            </p>
            {profile.polyuVerifiedAt ? (
              <p className="text-muted-foreground">
                理大认证：{formatDate(profile.polyuVerifiedAt)}
              </p>
            ) : null}
            {!sessionUser && (
              <p className="text-muted-foreground">
                <Link href={ROUTES.login} className="text-primary hover:underline">
                  登录
                </Link>{" "}
                后可查看更多信息
              </p>
            )}
            {sessionUser && !isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.profile(sessionUser.id)}>返回我的主页</Link>
              </Button>
            )}
            {sessionUser && isOwnProfile && !profile.onboardingCompleted && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                请先{" "}
                <Link href={ROUTES.onboarding} className="font-medium underline">
                  完善个人资料
                </Link>{" "}
                后再使用完整功能。
              </p>
            )}
          </CardContent>
        </Card>

        {favorites ? <ProfileFavoritesSection favorites={favorites} /> : null}
      </div>
    </ModulePageShell>
  );
}
