import Link from "next/link";
import { notFound } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { FeedbackAdminReplyForm } from "@/components/feedback/FeedbackAdminReplyForm";
import { FeedbackDetailView } from "@/components/feedback/FeedbackDetailView";
import { USER_ROLES } from "@/constants/userRoles";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { listCommentsByTarget } from "@/lib/db/comments";
import { getFeedbackPostById } from "@/lib/db/feedback";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { isAdmin } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";

type FeedbackDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  const { id } = await params;
  const [post, comments, user] = await Promise.all([
    getFeedbackPostById(id),
    listCommentsByTarget(TARGET_TYPES.post, id),
    getSessionUser(),
  ]);

  if (!post) {
    notFound();
  }

  const adminReplies = comments.filter(
    (comment) => comment.author.role === USER_ROLES.admin && !comment.parentId,
  );

  return (
    <ModulePageShell
      title="反馈详情"
      description="用户反馈与管理员回复"
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.feedback.list}>返回列表</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <FeedbackDetailView post={post} replies={adminReplies} />
        {isAdmin(user) ? <FeedbackAdminReplyForm postId={post.id} /> : null}
        {!isAdmin(user) ? (
          <p className="text-xs text-muted-foreground">
            仅管理员可以回复反馈。如需补充信息，请再提交一条新反馈。
          </p>
        ) : null}
      </div>
    </ModulePageShell>
  );
}
