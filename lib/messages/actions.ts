"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ROUTES } from "@/constants/routes";
import {
  getConversationById,
  getMessageContextWindow,
  getOrCreateConversation,
  getOtherMemberReadAt,
  listConversations,
  listMessages,
  markConversationRead,
  recallMessage,
  searchMessagesInConversation,
  sendMessage,
  submitMessageAppeal,
  syncConversationMessages,
} from "@/lib/db/messages";
import {
  blockUserForMessages,
  hasBlockedUser,
  isBlockedBy,
  unblockUserForMessages,
} from "@/lib/db/messageBlocks";
import { createReport } from "@/lib/db/reports";
import {
  buildMessageReportMetadata,
  formatMessageReportDescription,
} from "@/lib/messages/formatMessageReport";
import { uploadMessageMediaToStorage } from "@/lib/messages/uploadMessageMedia";
import { DbError } from "@/lib/db/shared";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPermissionDeniedMessage } from "@/lib/utils/authPrompts";
import { assertCan, isBanned } from "@/lib/utils/permissions";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { MESSAGE_REPORT_CONTEXT_RADIUS } from "@/constants/messaging";
import {
  conversationIdSchema,
  messageAppealSchema,
  messageBlockSchema,
  messageRecallSchema,
  messageReportSchema,
  messageSearchSchema,
  sendMessageSchema,
} from "@/lib/validations/messageSchema";
import { type MessageWithSender } from "@/types/message";

export type MessageActionState = {
  error?: string;
  success?: string;
};

export type MessageMediaUploadState = {
  error?: string;
  attachment?: {
    publicUrl: string;
    mimeType: string;
    kind: "image" | "video";
  };
};

export async function sendMessageAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  if (isBanned(user)) {
    return { error: "当前账号无法发送私信" };
  }

  try {
    assertCan(user, "interaction:message:send");
  } catch {
    return { error: getPermissionDeniedMessage(user, "发送私信") };
  }

  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
    attachmentUrls: formData.getAll("attachmentUrls"),
    attachmentMimeTypes: formData.getAll("attachmentMimeTypes"),
    quoteMessageId: formData.get("quoteMessageId") || null,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "请检查消息内容",
    };
  }

  try {
    await sendMessage({
      conversationId: parsed.data.conversationId,
      senderId: user.id,
      body: parsed.data.body,
      contentType: parsed.data.contentType,
      attachmentUrls: parsed.data.attachmentUrls,
      attachmentMimeTypes: parsed.data.attachmentMimeTypes,
      quoteMessageId: parsed.data.quoteMessageId,
    });

    revalidatePath(ROUTES.messages.list);
    revalidatePath(ROUTES.messages.conversation(parsed.data.conversationId));
    return { success: "已发送" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "发送失败，请稍后重试",
    };
  }
}

export async function uploadMessageMediaAction(
  _prevState: MessageMediaUploadState,
  formData: FormData,
): Promise<MessageMediaUploadState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  if (isBanned(user)) {
    return { error: "当前账号无法上传" };
  }

  try {
    assertCan(user, "interaction:message:send");
  } catch {
    return { error: getPermissionDeniedMessage(user, "发送私信") };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "请选择文件" };
  }

  const result = await uploadMessageMediaToStorage(user.id, file);
  if (!result.ok) {
    return { error: result.error };
  }

  return {
    attachment: {
      publicUrl: result.publicUrl,
      mimeType: result.mimeType,
      kind: result.kind,
    },
  };
}

export async function markConversationReadAction(
  conversationId: string,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    return;
  }

  const parsed = conversationIdSchema.safeParse({ conversationId });
  if (!parsed.success) {
    return;
  }

  try {
    await markConversationRead(parsed.data.conversationId, user.id);
    revalidatePath(ROUTES.messages.list);
    revalidatePath(ROUTES.messages.conversation(parsed.data.conversationId));
  } catch {
    // ignore
  }
}

export async function fetchConversationMessagesAction(input: {
  conversationId: string;
  sync?: boolean;
}): Promise<MessageWithSender[]> {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  const parsed = conversationIdSchema.safeParse({
    conversationId: input.conversationId,
  });
  if (!parsed.success) {
    return [];
  }

  try {
    assertCan(user, "interaction:message:view");
    if (input.sync !== false) {
      return syncConversationMessages(parsed.data.conversationId, user.id);
    }
    return listMessages(parsed.data.conversationId, user.id);
  } catch {
    return [];
  }
}

export async function fetchConversationsAction(search?: string) {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  try {
    assertCan(user, "interaction:message:view");
    return listConversations(user.id, { search });
  } catch {
    return [];
  }
}

export async function redirectToConversationWithUser(userId: string) {
  const user = await getSessionUser();
  if (!user) {
    redirect(
      `${ROUTES.login}?next=${encodeURIComponent(ROUTES.messages.withUser(userId))}`,
    );
  }

  if (isBanned(user)) {
    redirect(ROUTES.messages.list);
  }

  try {
    assertCan(user, "interaction:message:send");
    const conversation = await getOrCreateConversation(user.id, userId);
    redirect(ROUTES.messages.conversation(conversation.id));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    redirect(ROUTES.messages.list);
  }
}

export async function getConversationForPage(
  conversationId: string,
  userId: string,
) {
  return getConversationById(conversationId, userId);
}

export async function translateMessageTextAction(
  text: string,
): Promise<{ translation?: string; error?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  if (isBanned(user)) {
    return { error: "当前账号无法使用翻译" };
  }

  try {
    assertCan(user, "interaction:message:view");
  } catch {
    return { error: "当前账号无法使用翻译" };
  }

  const { translateTextToChinese } = await import("@/lib/messages/translateText");
  const result = await translateTextToChinese(text);
  if (!result.ok) {
    return { error: result.error };
  }
  return { translation: result.translation };
}

export async function createMessageReportAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  if (isBanned(user)) {
    return { error: "当前账号无法举报" };
  }

  try {
    assertCan(user, "interaction:message:view");
  } catch {
    return { error: getPermissionDeniedMessage(user, "举报私信") };
  }

  const parsed = messageReportSchema.safeParse({
    messageId: formData.get("messageId"),
    reason: formData.get("reason"),
    description: formData.get("description") || undefined,
    includeContext: formData.get("includeContext"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "请检查举报信息",
    };
  }

  try {
    const window = await getMessageContextWindow(
      parsed.data.messageId,
      user.id,
      MESSAGE_REPORT_CONTEXT_RADIUS,
    );
    if (!window) {
      return { error: "消息不存在或无权举报" };
    }
    if (window.reported.senderId === user.id) {
      return { error: "不能举报自己的消息" };
    }

    const description = formatMessageReportDescription({
      userDescription: parsed.data.description,
    });
    const metadata = buildMessageReportMetadata({
      reportedMessage: window.reported,
      contextMessages: parsed.data.includeContext ? window.context : [],
      includeContext: parsed.data.includeContext,
    });

    await createReport({
      reporterId: user.id,
      targetType: TARGET_TYPES.message,
      targetId: parsed.data.messageId,
      reason: parsed.data.reason,
      description,
      metadata,
    });

    return { success: "举报已提交，管理员将尽快处理" };
  } catch (error) {
    return {
      error:
        error instanceof DbError
          ? error.message
          : "举报失败，请稍后重试",
    };
  }
}

export async function submitMessageAppealAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  if (isBanned(user)) {
    return { error: "当前账号无法申诉" };
  }

  const parsed = messageAppealSchema.safeParse({
    messageId: formData.get("messageId"),
    appealNote: formData.get("appealNote"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "请检查申诉内容",
    };
  }

  const conversationId = formData.get("conversationId");
  const conversationPath =
    typeof conversationId === "string" && conversationId.length > 0
      ? ROUTES.messages.conversation(conversationId)
      : ROUTES.messages.list;

  try {
    await submitMessageAppeal({
      messageId: parsed.data.messageId,
      senderId: user.id,
      appealNote: parsed.data.appealNote,
    });
    revalidatePath(ROUTES.messages.list);
    revalidatePath(conversationPath);
    return { success: "申诉已提交，请等待管理员审核" };
  } catch (error) {
    return {
      error:
        error instanceof DbError
          ? error.message
          : "申诉失败，请稍后重试",
    };
  }
}

export async function getOtherMemberReadAtAction(
  conversationId: string,
): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  try {
    assertCan(user, "interaction:message:view");
    return getOtherMemberReadAt(conversationId, user.id);
  } catch {
    return null;
  }
}

export async function searchMessagesAction(input: {
  conversationId: string;
  query: string;
}): Promise<MessageWithSender[]> {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }
  const parsed = messageSearchSchema.safeParse(input);
  if (!parsed.success) {
    return [];
  }
  try {
    assertCan(user, "interaction:message:view");
    return searchMessagesInConversation(
      parsed.data.conversationId,
      user.id,
      parsed.data.query,
    );
  } catch {
    return [];
  }
}

export async function recallMessageAction(
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  if (isBanned(user)) {
    return { error: "当前账号无法撤回消息" };
  }

  const parsed = messageRecallSchema.safeParse({
    messageId: formData.get("messageId"),
    conversationId: formData.get("conversationId"),
  });
  if (!parsed.success) {
    return { error: "无效的消息" };
  }

  try {
    assertCan(user, "interaction:message:send");
    await recallMessage(parsed.data.messageId, user.id);
    revalidatePath(ROUTES.messages.list);
    revalidatePath(ROUTES.messages.conversation(parsed.data.conversationId));
    return { success: "已撤回" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "撤回失败",
    };
  }
}

export async function blockUserMessagesAction(
  otherUserId: string,
): Promise<{ error?: string; success?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  const parsed = messageBlockSchema.safeParse({ otherUserId });
  if (!parsed.success) {
    return { error: "无效的用户" };
  }
  try {
    assertCan(user, "interaction:message:view");
    await blockUserForMessages(user.id, parsed.data.otherUserId);
    revalidatePath(ROUTES.messages.list);
    return { success: "已屏蔽该用户的私信" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "屏蔽失败",
    };
  }
}

export async function unblockUserMessagesAction(
  otherUserId: string,
): Promise<{ error?: string; success?: string }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }
  const parsed = messageBlockSchema.safeParse({ otherUserId });
  if (!parsed.success) {
    return { error: "无效的用户" };
  }
  try {
    await unblockUserForMessages(user.id, parsed.data.otherUserId);
    revalidatePath(ROUTES.messages.list);
    return { success: "已取消屏蔽" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "操作失败",
    };
  }
}

export async function getMessageBlockStatusAction(otherUserId: string): Promise<{
  blockedByMe: boolean;
  blockedMe: boolean;
}> {
  const user = await getSessionUser();
  if (!user) {
    return { blockedByMe: false, blockedMe: false };
  }
  const [blockedByMe, blockedMe] = await Promise.all([
    hasBlockedUser(user.id, otherUserId),
    isBlockedBy(user.id, otherUserId),
  ]);
  return { blockedByMe, blockedMe };
}
