import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentGuideDetailView } from "@/components/content/ContentGuideViews";
import { ContentViewTracker } from "@/components/common/ContentViewTracker";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { getSessionUser } from "@/lib/auth/session";
import { getContentGuideById } from "@/lib/db/contentGuides";
import { hasReaction } from "@/lib/db/reactions";
import { ROUTES } from "@/constants/routes";
import { can } from "@/lib/utils/permissions";

type StudyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StudyDetailPage({ params }: StudyDetailPageProps) {
  const { id } = await params;
  const [guide, user] = await Promise.all([
    getContentGuideById("study", id),
    getSessionUser(),
  ]);

  if (!guide) {
    notFound();
  }

  const revalidatePath = ROUTES.study.detail(id);
  const canLike = can(user, "interaction:like");
  const isLiked = user
    ? await hasReaction({
        userId: user.id,
        targetType: TARGET_TYPES.post,
        targetId: id,
        type: "like",
      })
    : false;

  return (
    <ModulePageShell
      title={guide.title}
      description={`${MODULE_REGISTRY.study.label} · 详情页`}
      back={{ href: ROUTES.study.list, label: "学习指南" }}
    >
      <ContentViewTracker targetType={TARGET_TYPES.post} targetId={id} />
      <ContentGuideDetailView
        guide={guide}
        likeCount={guide.likeCount}
        isLiked={isLiked}
        isLoggedIn={Boolean(user)}
        canLike={canLike}
        revalidatePath={revalidatePath}
      />
    </ModulePageShell>
  );
}
