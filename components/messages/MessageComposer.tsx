"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Send, Smile, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageComposerEmojiPicker } from "@/components/messages/MessageComposerEmojiPicker";
import { MessageQuotePreviewBar } from "@/components/messages/MessageQuotePreviewBar";
import { MESSAGE_LIMITS } from "@/constants/messaging";
import {
  sendMessageAction,
  uploadMessageMediaAction,
  type MessageActionState,
} from "@/lib/messages/actions";
import {
  buildMessageBodyWithQuote,
  getMessageQuotePreview,
} from "@/lib/messages/formatMessageQuote";
import { useTypingBroadcast } from "@/hooks/useConversationChannel";
import { cn } from "@/lib/utils/cn";
import { type MessageWithSender } from "@/types/message";

type PendingAttachment = {
  publicUrl: string;
  mimeType: string;
  kind: "image" | "video";
};

type MessageComposerProps = {
  conversationId: string;
  disabled?: boolean;
  quoteRequest?: MessageWithSender | null;
  onQuoteConsumed?: () => void;
  currentUserId?: string;
  onSent?: () => void;
};

const initialSendState: MessageActionState = {};

export function MessageComposer({
  conversationId,
  disabled = false,
  quoteRequest = null,
  onQuoteConsumed,
  currentUserId,
  onSent,
}: MessageComposerProps) {
  const [state, formAction, pending] = useActionState(
    sendMessageAction,
    initialSendState,
  );
  const [body, setBody] = useState("");
  const [activeQuote, setActiveQuote] = useState<MessageWithSender | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isUploading, startUpload] = useTransition();
  const [isSending, startSend] = useTransition();
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiToggleRef = useRef<HTMLButtonElement>(null);
  const savedDraftRef = useRef<{
    body: string;
    attachments: PendingAttachment[];
    activeQuote: MessageWithSender | null;
  } | null>(null);

  const quotePreview = activeQuote ? getMessageQuotePreview(activeQuote) : null;
  const hasVideo = attachments.some((item) => item.kind === "video");
  const imageCount = attachments.filter((item) => item.kind === "image").length;
  const busy = pending || isUploading || isSending || disabled;
  const { notifyTyping } = useTypingBroadcast(
    conversationId,
    currentUserId ?? conversationId,
  );

  useEffect(() => {
    if (state.error && savedDraftRef.current) {
      setBody(savedDraftRef.current.body);
      setAttachments(savedDraftRef.current.attachments);
      setActiveQuote(savedDraftRef.current.activeQuote);
      savedDraftRef.current = null;
      return;
    }
    if (state.success) {
      savedDraftRef.current = null;
      setActiveQuote(null);
      onSent?.();
      router.refresh();
    }
  }, [state.error, state.success, router, onSent]);

  useEffect(() => {
    if (!quoteRequest) {
      return;
    }
    setActiveQuote(quoteRequest);
    onQuoteConsumed?.();
    textareaRef.current?.focus();
  }, [quoteRequest, onQuoteConsumed]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) {
      return;
    }
    const trimmed = body.trim();
    if (!trimmed && attachments.length === 0) {
      return;
    }

    const finalBody = activeQuote
      ? buildMessageBodyWithQuote(activeQuote, trimmed)
      : trimmed;

    savedDraftRef.current = {
      body,
      attachments: [...attachments],
      activeQuote,
    };
    setBody("");
    setAttachments([]);
    setActiveQuote(null);

    const formData = new FormData(event.currentTarget);
    formData.set("body", finalBody);
    startSend(() => {
      formAction(formData);
    });
  }

  function uploadFile(file: File) {
    setUploadError(null);
    startUpload(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadMessageMediaAction({}, formData);
      if (result.error) {
        setUploadError(result.error);
        return;
      }
      if (!result.attachment) {
        return;
      }
      setAttachments((current) => {
        if (result.attachment!.kind === "video") {
          return [result.attachment!];
        }
        return [...current.filter((item) => item.kind === "image"), result.attachment!].slice(
          0,
          MESSAGE_LIMITS.maxImagesPerMessage,
        );
      });
    });
  }

  function removeAttachment(url: string) {
    setAttachments((current) => current.filter((item) => item.publicUrl !== url));
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((current) => current + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = body.slice(0, start) + emoji + body.slice(end);
    setBody(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    });
    if (currentUserId) {
      notifyTyping(nextValue.trim().length > 0);
    }
  }

  return (
    <div className="border-t bg-background p-3">
      {attachments.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((item) => (
            <div
              key={item.publicUrl}
              className="relative rounded-md border bg-muted/40 px-2 py-1 text-xs"
            >
              {item.kind === "video" ? "视频" : "图片"}已添加
              <button
                type="button"
                className="ml-2 text-destructive"
                onClick={() => removeAttachment(item.publicUrl)}
                disabled={busy}
              >
                移除
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <form action={formAction} className="space-y-2" onSubmit={handleSubmit}>
        <input type="hidden" name="conversationId" value={conversationId} />
        {activeQuote ? (
          <input type="hidden" name="quoteMessageId" value={activeQuote.id} />
        ) : null}
        {attachments.map((item) => (
          <input
            key={item.publicUrl}
            type="hidden"
            name="attachmentUrls"
            value={item.publicUrl}
          />
        ))}
        {attachments.map((item) => (
          <input
            key={`${item.publicUrl}-mime`}
            type="hidden"
            name="attachmentMimeTypes"
            value={item.mimeType}
          />
        ))}

        <div className="relative">
          <MessageComposerEmojiPicker
            open={emojiPickerOpen}
            onClose={() => setEmojiPickerOpen(false)}
            ignoreRef={emojiToggleRef}
            onSelect={(emoji) => {
              insertEmoji(emoji);
              setEmojiPickerOpen(false);
            }}
            className="absolute inset-x-0 bottom-0 z-30"
          />

          <div className="overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
            {quotePreview ? (
              <div className="border-b border-border/60 px-2 pt-2">
                <MessageQuotePreviewBar
                  senderName={quotePreview.senderName}
                  previewText={quotePreview.previewText}
                  onDismiss={() => setActiveQuote(null)}
                />
              </div>
            ) : null}

            <textarea
              ref={textareaRef}
              name="body"
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                if (currentUserId) {
                  notifyTyping(event.target.value.trim().length > 0);
                }
              }}
              placeholder={quotePreview ? "回复…" : "输入消息…"}
              rows={2}
              maxLength={MESSAGE_LIMITS.maxBodyLength}
              disabled={busy}
              className="flex min-h-[72px] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm focus-visible:outline-none"
              onCompositionStart={() => {
                isComposingRef.current = true;
              }}
              onCompositionEnd={() => {
                isComposingRef.current = false;
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.shiftKey) {
                  return;
                }
                if (event.nativeEvent.isComposing || isComposingRef.current) {
                  return;
                }
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              ref={emojiToggleRef}
              type="button"
              variant="ghost"
              size="icon"
              disabled={busy}
              onClick={() => setEmojiPickerOpen((open) => !open)}
              aria-label="插入表情"
              aria-expanded={emojiPickerOpen}
            >
              <Smile className={cn("h-4 w-4", emojiPickerOpen && "text-primary")} />
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={busy || hasVideo}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadFile(file);
                event.target.value = "";
              }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              disabled={busy || hasVideo || imageCount > 0}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadFile(file);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={busy || hasVideo || imageCount >= MESSAGE_LIMITS.maxImagesPerMessage}
              onClick={() => imageInputRef.current?.click()}
              aria-label="添加图片"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={busy || hasVideo || imageCount > 0 || attachments.length > 0}
              onClick={() => videoInputRef.current?.click()}
              aria-label="添加视频"
            >
              <Video className="h-4 w-4" />
            </Button>
          </div>

          <Button type="submit" disabled={busy || (!body.trim() && attachments.length === 0)}>
            {pending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                发送中
              </>
            ) : (
              <>
                <Send className="mr-1 h-4 w-4" />
                发送
              </>
            )}
          </Button>
        </div>
      </form>

      {uploadError ? (
        <p className="mt-1 text-xs text-destructive">{uploadError}</p>
      ) : null}
      {state.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}
