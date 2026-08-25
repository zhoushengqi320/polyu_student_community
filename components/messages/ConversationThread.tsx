"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Ban, Search, X } from "lucide-react";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { MessageAppealDialog } from "@/components/messages/MessageAppealDialog";
import {
  clearPendingMessageAppealId,
  peekPendingMessageAppealId,
} from "@/components/messages/HiddenMessagesPanel";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MESSAGE_LIMITS } from "@/constants/messaging";
import { ROUTES } from "@/constants/routes";
import {
  formatMessagePreviewText,
  getMessageSenderLabel,
} from "@/lib/messages/formatMessageQuote";
import { formatDateTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";
import { useConversationChannel } from "@/hooks/useConversationChannel";
import { useHighlightTargetId } from "@/hooks/useContentHighlight";
import {
  blockUserMessagesAction,
  fetchConversationMessagesAction,
  getMessageBlockStatusAction,
  getOtherMemberReadAtAction,
  markConversationReadAction,
  searchMessagesAction,
  unblockUserMessagesAction,
} from "@/lib/messages/actions";
import { type MessageWithSender } from "@/types/message";
import { type ProfileListItem } from "@/types/user";

type ConversationThreadProps = {
  conversationId: string;
  currentUserId: string;
  otherUser: ProfileListItem;
  initialMessages: MessageWithSender[];
  onInboxChange?: () => void;
};

export function ConversationThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
  onInboxChange,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageWithSender[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(
    null,
  );
  const urlHighlightId = useHighlightTargetId();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [appealMessageId, setAppealMessageId] = useState<string | null>(null);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [blockStatus, setBlockStatus] = useState({
    blockedByMe: false,
    blockedMe: false,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldInstantScrollRef = useRef(true);
  const [quoteRequest, setQuoteRequest] = useState<MessageWithSender | null>(
    null,
  );
  const name = otherUser.displayName ?? otherUser.username ?? "PolyU 同学";
  const searchActive = searchOpen;

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedMessageId(null);
  }

  function getSearchResultPreview(item: MessageWithSender): string {
    const preview = formatMessagePreviewText(item.body);
    if (preview) {
      return preview;
    }
    if (item.attachmentUrls.length > 0) {
      const hasVideo = item.attachmentMimeTypes.some((mime) =>
        mime.startsWith("video/"),
      );
      return hasVideo ? "[视频]" : "[图片]";
    }
    return "（空消息）";
  }

  const syncMessages = useCallback(async () => {
    const synced = await fetchConversationMessagesAction({
      conversationId,
      sync: true,
    });
    setMessages((current) => {
      if (synced.length === 0 && current.length > 0) {
        return current;
      }
      if (synced.length !== current.length) {
        shouldInstantScrollRef.current = false;
      }
      return synced;
    });
    onInboxChange?.();
  }, [conversationId, onInboxChange]);

  const refreshReadReceipt = useCallback(async () => {
    const readAt = await getOtherMemberReadAtAction(conversationId);
    setOtherReadAt(readAt);
  }, [conversationId]);

  useEffect(() => {
    setMessages(initialMessages);
    shouldInstantScrollRef.current = true;
  }, [conversationId, initialMessages]);

  useEffect(() => {
    const pendingAppealId = peekPendingMessageAppealId();
    if (pendingAppealId) {
      setAppealMessageId(pendingAppealId);
    }
  }, [conversationId]);

  useEffect(() => {
    void markConversationReadAction(conversationId);
    void refreshReadReceipt();
    void getMessageBlockStatusAction(otherUser.id).then(setBlockStatus);
  }, [conversationId, otherUser.id, refreshReadReceipt]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    if (urlHighlightId?.startsWith("message-")) {
      shouldInstantScrollRef.current = false;
      return;
    }
    const behavior = shouldInstantScrollRef.current ? "auto" : "smooth";
    container.scrollTo({ top: container.scrollHeight, behavior });
    shouldInstantScrollRef.current = false;
  }, [messages.length, urlHighlightId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void syncMessages();
      void refreshReadReceipt();
    }, MESSAGE_LIMITS.pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [syncMessages, refreshReadReceipt]);

  useConversationChannel({
    conversationId,
    currentUserId,
    onMessagesChange: () => {
      void syncMessages();
    },
    onReadReceiptChange: () => {
      void refreshReadReceipt();
    },
    onTypingChange: setIsOtherTyping,
  });

  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchMessagesAction({
        conversationId,
        query: searchQuery.trim(),
      }).then(setSearchResults);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [conversationId, searchOpen, searchQuery]);

  useEffect(() => {
    if (!highlightedMessageId) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHighlightedMessageId(null);
    }, MESSAGE_LIMITS.searchHighlightMs);
    return () => window.clearTimeout(timer);
  }, [highlightedMessageId]);

  useEffect(() => {
    const highlightParam = searchParams.get("highlight")?.trim() ?? "";
    const messageId = highlightParam.startsWith("message-")
      ? highlightParam.slice("message-".length)
      : urlHighlightId?.startsWith("message-")
        ? urlHighlightId.slice("message-".length)
        : null;

    if (!messageId) {
      return;
    }

    setHighlightedMessageId(messageId);

    if (searchParams.get("appeal") === "1") {
      setAppealMessageId(messageId);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("appeal");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }

    window.setTimeout(() => {
      document
        .getElementById(`message-${messageId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [urlHighlightId, searchParams, pathname, router]);

  function jumpToSearchResult(messageId: string) {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedMessageId(messageId);
    window.setTimeout(() => {
      const element = document.getElementById(`message-${messageId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      window.alert("无法定位原消息，可能尚未加载或已被撤回");
    }, 80);
  }

  async function confirmBlockAction() {
    const result = blockStatus.blockedByMe
      ? await unblockUserMessagesAction(otherUser.id)
      : await blockUserMessagesAction(otherUser.id);
    if (!result.error) {
      const status = await getMessageBlockStatusAction(otherUser.id);
      setBlockStatus(status);
    }
    setBlockConfirmOpen(false);
  }

  function openBlockConfirm() {
    setBlockConfirmOpen(true);
  }

  const composerDisabled = blockStatus.blockedByMe || blockStatus.blockedMe;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          asChild
        >
          <Link href={ROUTES.messages.list} aria-label="返回会话列表">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Link
          href={ROUTES.profile(otherUser.id)}
          className="flex min-w-0 flex-1 items-center gap-2 hover:text-primary"
        >
          <UserAvatar src={otherUser.avatarUrl} name={name} size="sm" />
          <div className="min-w-0">
            <span className="block truncate font-medium">{name}</span>
            {isOtherTyping ? (
              <span className="text-xs text-muted-foreground">正在输入…</span>
            ) : null}
          </div>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="搜索消息"
          onClick={() => {
            setHighlightedMessageId(null);
            setSearchOpen((open) => !open);
          }}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={blockStatus.blockedByMe ? "取消屏蔽" : "屏蔽私信"}
          onClick={openBlockConfirm}
        >
          <Ban className={blockStatus.blockedByMe ? "h-4 w-4 text-destructive" : "h-4 w-4"} />
        </Button>
      </div>

      <Dialog open={blockConfirmOpen} onOpenChange={setBlockConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blockStatus.blockedByMe ? "取消屏蔽私信？" : "屏蔽该用户私信？"}
            </DialogTitle>
            <DialogDescription>
              {blockStatus.blockedByMe
                ? `取消屏蔽后，你可以再次与 ${name} 收发私信。`
                : `屏蔽后，你将无法与 ${name} 收发私信，对方也无法再向你发送消息。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              variant={blockStatus.blockedByMe ? "default" : "destructive"}
              onClick={() => void confirmBlockAction()}
            >
              {blockStatus.blockedByMe ? "取消屏蔽" : "确认屏蔽"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {searchOpen ? (
        <div className="relative z-10 space-y-2 border-b bg-background px-4 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setHighlightedMessageId(null);
              }}
              placeholder="搜索本会话消息…"
              className="h-8"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {searchResults.length > 0 ? (
            <div className="max-h-40 space-y-1 overflow-y-auto overscroll-y-contain">
              {searchResults.map((item) => {
                const senderLabel = getMessageSenderLabel(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full rounded-md px-2 py-2 text-left hover:bg-muted"
                    onClick={() => jumpToSearchResult(item.id)}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium">{senderLabel}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {getSearchResultPreview(item)}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-xs text-muted-foreground">无匹配消息</p>
          ) : null}
        </div>
      ) : null}

      {blockStatus.blockedByMe ? (
        <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          你已屏蔽该用户，无法收发私信。点击右上角图标可取消屏蔽。
        </div>
      ) : null}
      {blockStatus.blockedMe ? (
        <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          对方已拒收你的私信，消息可能无法送达。
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        {searchActive ? (
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-black/10"
            aria-hidden
          />
        ) : null}
        <div
          ref={scrollContainerRef}
          className={cn(
            "relative z-0 h-full space-y-4 overflow-y-auto overscroll-y-contain px-4 py-4 transition-[filter,opacity] duration-200",
            searchActive && "brightness-[0.92]",
          )}
        >
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              还没有消息，发第一条打个招呼吧。
            </p>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const isLastOwn =
                isOwn &&
                !messages.slice(index + 1).some((item) => item.senderId === currentUserId);
              const isRead =
                isOwn &&
                otherReadAt != null &&
                new Date(otherReadAt).getTime() >= new Date(message.createdAt).getTime();
              const isHighlighted = highlightedMessageId === message.id;
              const shouldDim = Boolean(highlightedMessageId) && !isHighlighted;

              return (
                <div
                  key={message.id}
                  id={`message-${message.id}`}
                  className={cn(
                    "scroll-mt-4 -mx-4 px-4 py-2",
                    isHighlighted && "animate-message-search-highlight",
                    shouldDim && "animate-message-search-dim",
                  )}
                >
                  <MessageBubble
                    message={message}
                    conversationId={conversationId}
                    isOwn={isOwn}
                    isLoggedIn
                    isRead={isLastOwn ? isRead : undefined}
                    onQuote={setQuoteRequest}
                    onQuoteNavigate={jumpToSearchResult}
                    onRefresh={() => void syncMessages()}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <MessageComposer
        conversationId={conversationId}
        quoteRequest={quoteRequest}
        onQuoteConsumed={() => setQuoteRequest(null)}
        disabled={composerDisabled}
        currentUserId={currentUserId}
        onSent={() => {
          void syncMessages();
        }}
      />

      {appealMessageId ? (
        <MessageAppealDialog
          messageId={appealMessageId}
          conversationId={conversationId}
          open
          onOpenChange={(open) => {
            if (!open) {
              clearPendingMessageAppealId();
              setAppealMessageId(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
