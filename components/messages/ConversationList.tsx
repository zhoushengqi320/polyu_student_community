"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { formatMessagePreviewText } from "@/lib/messages/formatMessageQuote";
import { fetchConversationsAction } from "@/lib/messages/actions";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";
import { type ConversationListItem } from "@/types/message";

type ConversationListProps = {
  conversations: ConversationListItem[];
  activeConversationId?: string;
};

export function ConversationList({
  conversations: initialConversations,
  activeConversationId,
}: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchConversationsAction(search.trim() || undefined).then(setConversations);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  if (conversations.length === 0 && !search.trim()) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索会话或消息预览…"
              className="h-9 pl-8"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          还没有私信会话。访问同学个人主页即可发起聊天。
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-background px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索会话或消息预览…"
            className="h-9 pl-8"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain divide-y">
        {conversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">无匹配会话</p>
        ) : (
          conversations.map((item) => {
            const isActive = item.id === activeConversationId;
            const name =
              item.otherUser.displayName ?? item.otherUser.username ?? "PolyU 同学";

            return (
              <Link
                key={item.id}
                href={ROUTES.messages.conversation(item.id)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                  isActive && "bg-muted",
                )}
              >
                <UserAvatar
                  src={item.otherUser.avatarUrl}
                  name={name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        item.unreadCount > 0 ? "font-semibold" : "font-medium",
                      )}
                    >
                      {name}
                    </p>
                    {item.lastMessageAt ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(item.lastMessageAt)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {item.lastMessagePreview
                        ? formatMessagePreviewText(item.lastMessagePreview)
                        : "开始聊天吧"}
                    </p>
                    {item.unreadCount > 0 ? (
                      <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
