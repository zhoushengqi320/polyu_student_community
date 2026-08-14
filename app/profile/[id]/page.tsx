import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { TagBadge } from "@/components/common/TagBadge";
import { ProfileFavoritesSection } from "@/components/profile/ProfileFavoritesSection";
import { ProfileWorksSection } from "@/components/profile/ProfileWorksSection";
import { ProfileEditPanel } from "@/components/profile/ProfileEditPanel";
import { getSessionUser } from "@/lib/auth/session";
import { getUserFavorites } from "@/lib/db/favorites";
import { listProfileWorks } from "@/lib/db/profileWorks";
import { getProfileById } from "@/lib/db/profiles";
import { ROUTES } from "@/constants/routes";
import { USER_ROLE_LABELS } from "@/constants/userRoles";
import { getStudentGradeLabel } from "@/constants/profileOptions";
import { PROFILE_REVIEW_STATUS_LABELS } from "@/constants/profileReview";
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

  if (!sessionUser) {
    redirect(ROUTES.login);
  }

  const profile = await getProfileById(id);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = sessionUser.id === id;
  const [favorites, works] = isOwnProfile
    ? await Promise.all([getUserFavorites(id), listProfileWorks(id)])
    : [null, null];

  return (
    <ModulePageShell
      title={profile.displayName ?? "PolyU 同学"}
      description="个人主页"
      back={{ href: "/", label: "首页" }}
      actions={
        isOwnProfile && !profile.isFirstSetupCompleted ? (
          <Button variant="outline" asChild>
            <Link href={ROUTES.onboarding}>完善资料</Link>
          </Button>
        ) : null
      }
    >
      <div className="space-y-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{profile.displayName}</CardTitle>
                  <TagBadge label={USER_ROLE_LABELS[profile.role]} />
                </div>
                {isOwnProfile ? (
                  <CardDescription>
                    审核状态：
                    {PROFILE_REVIEW_STATUS_LABELS[profile.profileReviewStatus]}
                  </CardDescription>
                ) : null}
              </div>
            </div>
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
            {!isOwnProfile ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.profile(sessionUser.id)}>返回我的主页</Link>
              </Button>
            ) : null}
            {isOwnProfile && !profile.isFirstSetupCompleted ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                请先{" "}
                <Link href={ROUTES.onboarding} className="font-medium underline">
                  完善个人资料
                </Link>{" "}
                后再使用完整功能。
              </p>
            ) : null}
            {isOwnProfile ? (
              <div className="pt-2">
                <ProfileEditPanel
                  profile={profile}
                  email={sessionUser.email}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        {favorites && works ? (
          <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
            <ProfileFavoritesSection favorites={favorites} />
            <ProfileWorksSection works={works} />
          </div>
        ) : null}
      </div>
    </ModulePageShell>
  );
}
