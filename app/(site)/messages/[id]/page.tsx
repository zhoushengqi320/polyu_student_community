import { notFound, redirect } from "next/navigation";
import { MessageInboxShell } from "@/components/messages/MessageInboxShell";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getOtherUserId } from "@/lib/db/mappers/message";
import {
  getConversationById,
  listConversations,
  listMessages,
  listOwnHiddenMessages,
} from "@/lib/db/messages";
import { getProfileById } from "@/lib/db/profiles";
import { can, isBanned } from "@/lib/utils/permissions";

type MessageConversationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MessageConversationPage({
  params,
}: MessageConversationPageProps) {
  if (!isFeatureEnabled("messaging")) {
    notFound();
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.messages.list)}`);
  }
  if (isBanned(user) || !can(user, "interaction:message:view")) {
    notFound();
  }

  const { id } = await params;
  const conversation = await getConversationById(id, user.id);
  if (!conversation) {
    notFound();
  }

  const otherUserId = getOtherUserId(conversation, user.id);
  const [conversations, messages, otherUser, hiddenMessages] = await Promise.all([
    listConversations(user.id),
    listMessages(id, user.id),
    getProfileById(otherUserId),
    listOwnHiddenMessages(user.id),
  ]);

  if (!otherUser) {
    notFound();
  }

  return (
    <ModulePageShell
      title="我的私信"
      back={{ href: ROUTES.home, label: "首页" }}
      hideTitle
      compact
      fullWidth
    >
      <MessageInboxShell
        conversations={conversations}
        activeConversationId={id}
        currentUserId={user.id}
        otherUser={{
          id: otherUser.id,
          username: otherUser.username,
          displayName: otherUser.displayName,
          avatarUrl: otherUser.avatarUrl,
          role: otherUser.role,
        }}
        initialMessages={messages}
        hiddenMessages={hiddenMessages}
      />
    </ModulePageShell>
  );
}
