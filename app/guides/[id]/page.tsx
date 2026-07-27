import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { GuideDetailView } from "@/components/guides/GuideDetailView";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { getSessionUser } from "@/lib/auth/session";
import {
  countCommentsInThread,
  listPostCommentThread,
} from "@/lib/db/comments";
import { getGuideById } from "@/lib/db/guides";
import { countReactions } from "@/lib/db/reactions";
import { can, isAdmin } from "@/lib/utils/permissions";

type GuideDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  const revalidatePath = ROUTES.guides.detail(id);

  const [guide, commentThread] = await Promise.all([
    getGuideById(id, user?.id),
    listPostCommentThread(id),
  ]);

  if (!guide) {
    notFound();
  }

  const favoriteCount = await countReactions({
    targetType: TARGET_TYPES.post,
    targetId: id,
    type: "favorite",
  });

  const totalCommentCount = countCommentsInThread(commentThread);
  const canComment = can(user, "interaction:comment");
  const canFavorite = can(user, "interaction:like");

  return (
    <ModulePageShell
      title={guide.title}
      description={`${MODULE_REGISTRY.guides.label} · 详情页`}
    >
      <GuideDetailView
        guide={guide}
        favoriteCount={favoriteCount}
        commentThread={commentThread}
        totalCommentCount={totalCommentCount}
        isLoggedIn={Boolean(user)}
        canComment={canComment}
        canFavorite={canFavorite}
        isAdmin={isAdmin(user)}
        currentUserId={user?.id}
        revalidatePath={revalidatePath}
      />
    </ModulePageShell>
  );
}
