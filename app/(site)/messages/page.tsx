import { notFound, redirect } from "next/navigation";
import { MessageInboxShell } from "@/components/messages/MessageInboxShell";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { listConversations, listOwnHiddenMessages } from "@/lib/db/messages";
import { redirectToConversationWithUser } from "@/lib/messages/actions";
import { can, isBanned } from "@/lib/utils/permissions";

type MessagesPageProps = {
  searchParams: Promise<{ user?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
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

  const params = await searchParams;
  if (params.user) {
    await redirectToConversationWithUser(params.user);
  }

  const [conversations, hiddenMessages] = await Promise.all([
    listConversations(user.id),
    listOwnHiddenMessages(user.id),
  ]);

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
        currentUserId={user.id}
        hiddenMessages={hiddenMessages}
      />
    </ModulePageShell>
  );
}
