import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ContentViewTracker } from "@/components/common/ContentViewTracker";
import { GuideDetailView } from "@/components/guides/GuideDetailView";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { getSessionUser } from "@/lib/auth/session";
import {
  countCommentsInThread,
  collectCommentIdsFromThread,
  listPostCommentThread,
} from "@/lib/db/comments";
import { getGuideById } from "@/lib/db/guides";
import {
  countReactions,
  getReactionSummariesForTargets,
  hasReaction,
} from "@/lib/db/reactions";
import { getVisitorId } from "@/lib/guest/visitorId";
import { can } from "@/lib/utils/permissions";

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

  const [favoriteCount, likeCount, isLiked] = await Promise.all([
    countReactions({
      targetType: TARGET_TYPES.post,
      targetId: id,
      type: "favorite",
    }),
    countReactions({
      targetType: TARGET_TYPES.post,
      targetId: id,
      type: "like",
    }),
    user
      ? hasReaction({
          userId: user.id,
          targetType: TARGET_TYPES.post,
          targetId: id,
          type: "like",
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
      description={`${MODULE_REGISTRY.guides.label} · 详情页`}
      back={{ href: ROUTES.guides.list, label: "入学攻略" }}
    >
      <ContentViewTracker targetType={TARGET_TYPES.post} targetId={id} />
      <GuideDetailView
        guide={guide}
        likeCount={likeCount}
        isLiked={isLiked}
        favoriteCount={favoriteCount}
        commentThread={commentThread}
        totalCommentCount={totalCommentCount}
        isLoggedIn={Boolean(user)}
        canComment={canComment}
        canFavorite={canFavorite}
        canLike={canLike}
        currentUserId={user?.id}
        revalidatePath={revalidatePath}
        commentReactionMap={commentReactionMap}
      />
    </ModulePageShell>
  );
}
