"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/messages/ConversationList";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { cn } from "@/lib/utils/cn";
import { fetchConversationsAction } from "@/lib/messages/actions";
import { usePostgresChanges } from "@/hooks/usePostgresChanges";
import { type ConversationListItem, type MessageWithSender } from "@/types/message";
import { type ProfileListItem } from "@/types/user";

type MessageInboxShellProps = {
  conversations: ConversationListItem[];
  activeConversationId?: string;
  currentUserId: string;
  otherUser?: ProfileListItem;
  initialMessages?: MessageWithSender[];
};

export function MessageInboxShell({
  conversations: initialConversations,
  activeConversationId,
  currentUserId,
  otherUser,
  initialMessages = [],
}: MessageInboxShellProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const showThread = Boolean(activeConversationId && otherUser);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  async function refreshConversations() {
    const next = await fetchConversationsAction();
    setConversations(next);
    router.refresh();
  }

  usePostgresChanges(
    true,
    `inbox:${currentUserId}`,
    [
      { table: "messages", event: "INSERT" },
      { table: "messages", event: "UPDATE" },
      {
        table: "conversation_members",
        filter: `user_id=eq.${currentUserId}`,
      },
    ],
    () => {
      void refreshConversations();
    },
  );

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-hidden overscroll-contain rounded-xl border bg-background shadow-sm">
      <aside
        className={cn(
          "flex min-h-0 w-full shrink-0 flex-col border-r lg:w-72 xl:w-80",
          showThread ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="shrink-0 border-b px-4 py-3">
          <h2 className="text-lg font-semibold tracking-tight">我的私信</h2>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
          />
        </div>
      </aside>

      <section
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          showThread ? "flex" : "hidden lg:flex",
        )}
      >
        {showThread && activeConversationId && otherUser ? (
          <ConversationThread
            conversationId={activeConversationId}
            currentUserId={currentUserId}
            otherUser={otherUser}
            initialMessages={initialMessages}
            onInboxChange={() => {
              void refreshConversations();
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            选择左侧会话，或从同学个人主页发起私信。
          </div>
        )}
      </section>
    </div>
  );
}
