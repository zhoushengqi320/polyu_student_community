"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { CircleHelp, Copy, Flag, Languages, Quote, Undo2 } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
  MessageContextMenu,
  type MessageContextMenuItem,
} from "@/components/messages/MessageContextMenu";
import { MessageAppealDialog } from "@/components/messages/MessageAppealDialog";
import { MessageReportDialog } from "@/components/messages/MessageReportDialog";
import { MessageQuotePreviewBar } from "@/components/messages/MessageQuotePreviewBar";
import {
  canTranslateMessageContent,
  getMessageCopyText,
  getMessageQuotePreview,
  getMessageSenderLabel,
  getMessageTextForTranslation,
  parseMessageBodyWithQuote,
  stripLeadingQuoteLines,
} from "@/lib/messages/formatMessageQuote";
import { MESSAGE_LIMITS } from "@/constants/messaging";
import { recallMessageAction, translateMessageTextAction } from "@/lib/messages/actions";
import { ARCHIVE_APPEAL_STATUS } from "@/constants/moderation";
import { MESSAGE_VIOLATION_LABEL } from "@/constants/messaging";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type MessageWithSender } from "@/types/message";

type MessageBubbleProps = {
  message: MessageWithSender;
  conversationId: string;
  isOwn: boolean;
  isLoggedIn?: boolean;
  isRead?: boolean;
  onQuote?: (message: MessageWithSender) => void;
  onQuoteNavigate?: (messageId: string) => void;
  onRefresh?: () => void;
};

type MenuState = {
  x: number;
  y: number;
};

export function MessageBubble({
  message,
  conversationId,
  isOwn,
  isLoggedIn = false,
  isRead,
  onQuote,
  onQuoteNavigate,
  onRefresh,
}: MessageBubbleProps) {
  const isHidden = Boolean(message.moderationHiddenAt);
  const name = getMessageSenderLabel(message);
  const parsedBody = parseMessageBodyWithQuote(message.body);
  const displayReplyText = stripLeadingQuoteLines(parsedBody.replyText).trim();
  const copyText = getMessageCopyText(message);
  const canTranslate = canTranslateMessageContent({
    body: message.body,
    attachmentCount: message.attachmentUrls.length,
  });
  const longPressTimerRef = useRef<number | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [actionHint, setActionHint] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translationVisible, setTranslationVisible] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [isTranslating, startTranslate] = useTransition();

  const canRecall =
    isOwn &&
    !isHidden &&
    Date.now() - new Date(message.createdAt).getTime() <= MESSAGE_LIMITS.recallWindowMs;

  function handleRecall() {
    const formData = new FormData();
    formData.set("messageId", message.id);
    formData.set("conversationId", conversationId);
    void recallMessageAction({}, formData).then((result) => {
      if (result.success) {
        showHint("已撤回");
        onRefresh?.();
      } else if (result.error) {
        showHint(result.error);
      }
    });
  }

  function handleQuoteNavigate() {
    const targetId = message.quoteMessageId;
    if (targetId && onQuoteNavigate) {
      onQuoteNavigate(targetId);
      return;
    }
    window.alert("无法定位原消息，可能尚未加载或已被撤回");
  }

  const canAppeal =
    isOwn &&
    isHidden &&
    (message.appealStatus === ARCHIVE_APPEAL_STATUS.none ||
      message.appealStatus === ARCHIVE_APPEAL_STATUS.rejected);
  const appealPending =
    isOwn && isHidden && message.appealStatus === ARCHIVE_APPEAL_STATUS.pending;

  const showHint = useCallback((text: string) => {
    setActionHint(text);
    window.setTimeout(() => setActionHint(null), 1800);
  }, []);

  const openMenuAt = useCallback((x: number, y: number) => {
    if (isHidden) {
      return;
    }
    setMenu({ x, y });
  }, [isHidden]);

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  function handleContextMenu(event: React.MouseEvent) {
    if (isHidden) {
      return;
    }
    event.preventDefault();
    openMenuAt(event.clientX, event.clientY);
  }

  function handleTouchStart(event: React.TouchEvent) {
    if (isHidden) {
      return;
    }
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    longPressTimerRef.current = window.setTimeout(() => {
      openMenuAt(touch.clientX, touch.clientY);
    }, 500);
  }

  function clearLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  async function handleCopy() {
    if (!copyText) {
      showHint("暂无可复制内容");
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText);
      showHint("已复制");
    } catch {
      showHint("复制失败");
    }
  }

  function handleQuote() {
    if (!onQuote) {
      return;
    }
    onQuote(message);
    showHint("已添加引用");
  }

  function handleTranslate() {
    const text = getMessageTextForTranslation(message.body);
    if (!text) {
      return;
    }
    setTranslateError(null);
    setTranslation(null);
    setTranslationVisible(true);
    startTranslate(async () => {
      const result = await translateMessageTextAction(text);
      if (result.error) {
        setTranslateError(result.error);
        setTranslation(null);
        setTranslationVisible(false);
        return;
      }
      const translated = result.translation?.trim();
      if (!translated) {
        setTranslateError("没有可翻译的内容");
        setTranslation(null);
        setTranslationVisible(false);
        return;
      }
      setTranslation(translated);
      setTranslationVisible(true);
    });
  }

  function dismissTranslation() {
    setTranslationVisible(false);
    setTranslation(null);
  }

  const menuItems: MessageContextMenuItem[] = [
    {
      id: "copy",
      label: "复制",
      icon: Copy,
      disabled: !copyText,
      onSelect: () => {
        void handleCopy();
      },
    },
    {
      id: "quote",
      label: "引用",
      icon: Quote,
      disabled: !onQuote || !getMessageQuotePreview(message),
      onSelect: handleQuote,
    },
    {
      id: "translate",
      label: isTranslating ? "翻译中…" : "翻译",
      icon: Languages,
      disabled: !canTranslate || isTranslating,
      onSelect: handleTranslate,
    },
  ];

  if (!isOwn && isLoggedIn && !isHidden) {
    menuItems.push({
      id: "report",
      label: "举报",
      icon: Flag,
      onSelect: () => setReportOpen(true),
    });
  }

  if (canRecall) {
    menuItems.push({
      id: "recall",
      label: "撤回",
      icon: Undo2,
      onSelect: handleRecall,
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex gap-2",
          isOwn ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isOwn ? (
          <UserAvatar
            src={message.sender.avatarUrl}
            name={name}
            size="sm"
            className="mt-1 shrink-0"
          />
        ) : null}
        <div
          className={cn(
            "flex max-w-[min(100%,36rem)] flex-col gap-1",
            isOwn ? "items-end text-right" : "items-start text-left",
          )}
        >
          <div
            className={cn(
              "inline-block rounded-2xl px-3 py-2 text-sm leading-6",
              isHidden
                ? "border border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground"
                : isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
            )}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={clearLongPress}
            onTouchMove={clearLongPress}
            onTouchCancel={clearLongPress}
          >
            {isHidden ? (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  isOwn ? "flex-row-reverse" : "flex-row",
                )}
              >
                <span className="italic">{MESSAGE_VIOLATION_LABEL}</span>
                {canAppeal ? (
                  <button
                    type="button"
                    onClick={() => setAppealOpen(true)}
                    className={cn(
                      "inline-flex shrink-0 rounded-full p-0.5 transition-colors",
                      "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                    )}
                    title={
                      message.appealStatus === ARCHIVE_APPEAL_STATUS.rejected
                        ? "申诉被驳回，点击可再次申诉"
                        : "对此处理有疑问？点击申诉"
                    }
                    aria-label="申诉违规处理"
                  >
                    <CircleHelp className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                {parsedBody.quote ? (
                  <MessageQuotePreviewBar
                    senderName={parsedBody.quote.senderName}
                    previewText={parsedBody.quote.previewText}
                    compact
                    tone={isOwn ? "inverted" : "default"}
                    onClick={
                      message.quoteMessageId && onQuoteNavigate
                        ? handleQuoteNavigate
                        : undefined
                    }
                    className={cn(
                      "mb-2",
                      !isOwn && "bg-background/60",
                    )}
                  />
                ) : null}
                {displayReplyText ? (
                  <p className="whitespace-pre-wrap break-words">{displayReplyText}</p>
                ) : null}
                {!parsedBody.quote && !displayReplyText && message.body ? (
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                ) : null}
                {message.attachmentUrls.length > 0 ? (
                  <div
                    className={cn(
                      "space-y-2",
                      parsedBody.quote || displayReplyText ? "mt-2" : undefined,
                    )}
                  >
                    {message.attachmentUrls.map((url, index) => {
                      const mime = message.attachmentMimeTypes[index] ?? "";
                      const isVideo = mime.startsWith("video/");
                      if (isVideo) {
                        return (
                          <video
                            key={url}
                            src={url}
                            controls
                            className="max-h-64 w-full rounded-lg"
                          />
                        );
                      }
                      return (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-lg"
                        >
                          <Image
                            src={url}
                            alt="私信图片"
                            width={320}
                            height={240}
                            unoptimized
                            className="max-h-64 w-auto object-cover"
                          />
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {!isHidden && translationVisible ? (
            <div
              className={cn(
                "inline-block max-w-[min(100%,36rem)] rounded-xl border border-border/60 bg-background px-3 py-2 text-left text-xs leading-5 text-foreground shadow-sm",
                isOwn ? "self-end" : "self-start",
              )}
            >
              {isTranslating ? (
                <p className="text-muted-foreground">正在翻译</p>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                    {translation}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={dismissTranslation}
                  >
                    收起
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {appealPending ? (
            <p className="text-xs text-muted-foreground">申诉审核中</p>
          ) : null}
          {isOwn &&
          isHidden &&
          message.appealStatus === ARCHIVE_APPEAL_STATUS.rejected ? (
            <p className="text-xs text-muted-foreground">
              申诉未通过，可点击问号再次申诉
            </p>
          ) : null}

          {!isHidden && translateError ? (
            <p className="text-xs text-destructive">{translateError}</p>
          ) : null}
          {actionHint ? (
            <p className="text-xs text-muted-foreground">{actionHint}</p>
          ) : null}
          {isOwn && isRead != null ? (
            <p className="text-[11px] text-muted-foreground">
              {isRead ? "已读" : "已送达"}
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            {formatRelativeTime(message.createdAt)}
          </p>
        </div>
      </div>

      {!isHidden ? (
        <MessageContextMenu
          open={Boolean(menu)}
          x={menu?.x ?? 0}
          y={menu?.y ?? 0}
          items={menuItems}
          onClose={closeMenu}
        />
      ) : null}

      {!isOwn && !isHidden ? (
        <MessageReportDialog
          message={message}
          open={reportOpen}
          onOpenChange={setReportOpen}
          isLoggedIn={isLoggedIn}
        />
      ) : null}

      {canAppeal ? (
        <MessageAppealDialog
          messageId={message.id}
          conversationId={conversationId}
          open={appealOpen}
          onOpenChange={setAppealOpen}
        />
      ) : null}
    </>
  );
}
