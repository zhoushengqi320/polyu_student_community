import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentGuideDetailView } from "@/components/content/ContentGuideViews";
import { ContentViewTracker } from "@/components/common/ContentViewTracker";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { getSessionUser } from "@/lib/auth/session";
import {
  collectCommentIdsFromThread,
  countCommentsInThread,
  listPostCommentThread,
} from "@/lib/db/comments";
import { getContentGuideById } from "@/lib/db/contentGuides";
import {
  countReactions,
  getReactionSummariesForTargets,
  hasReaction,
} from "@/lib/db/reactions";
import { getVisitorId } from "@/lib/guest/visitorId";
import { ROUTES } from "@/constants/routes";
import { can } from "@/lib/utils/permissions";

type LifeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LifeDetailPage({ params }: LifeDetailPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  const revalidatePath = ROUTES.life.detail(id);

  const [guide, commentThread] = await Promise.all([
    getContentGuideById("life", id),
    listPostCommentThread(id),
  ]);

  if (!guide) {
    notFound();
  }

  const [favoriteCount, isLiked, isFavorited] = await Promise.all([
    countReactions({
      targetType: TARGET_TYPES.post,
      targetId: id,
      type: "favorite",
    }),
    user
      ? hasReaction({
          userId: user.id,
          targetType: TARGET_TYPES.post,
          targetId: id,
          type: "like",
        })
      : Promise.resolve(false),
    user
      ? hasReaction({
          userId: user.id,
          targetType: TARGET_TYPES.post,
          targetId: id,
          type: "favorite",
        })
      : Promise.resolve(false),
  ]);

  const totalCommentCount = countCommentsInThread(commentThread);
  const canComment = can(user, "interaction:comment");
  const canFavorite = can(user, "interaction:like");
  const canLike = can(user, "interaction:like");
  const commentIds = collectCommentIdsFromThread(commentThread);
  const visitorId = user ? null : await getVisitorId();
  const commentReactionMap = Object.fromEntries(
    (
      await getReactionSummariesForTargets({
        targetType: TARGET_TYPES.comment,
        targetIds: commentIds,
        userId: user?.id,
        visitorId: visitorId ?? undefined,
        type: "like",
      })
    ).entries(),
  );

  return (
    <ModulePageShell
      title={guide.title}
      description={`${MODULE_REGISTRY.life.label} · 详情页`}
      back={{ href: ROUTES.life.list, label: "生活指南" }}
    >
      <ContentViewTracker targetType={TARGET_TYPES.post} targetId={id} />
      <ContentGuideDetailView
        guide={guide}
        likeCount={guide.likeCount}
        isLiked={isLiked}
        isFavorited={isFavorited}
        favoriteCount={favoriteCount}
        commentThread={commentThread}
        totalCommentCount={totalCommentCount}
        isLoggedIn={Boolean(user)}
        canLike={canLike}
        canFavorite={canFavorite}
        canComment={canComment}
        currentUserId={user?.id}
        revalidatePath={revalidatePath}
        commentReactionMap={commentReactionMap}
        reportLabel="举报指南"
      />
    </ModulePageShell>
  );
}
