import {
  previewLabelForMessage,
  type MessageContentType,
  MESSAGE_LIMITS,
} from "@/constants/messaging";
import { NOTIFICATION_TYPES, ARCHIVE_APPEAL_STATUS } from "@/constants/moderation";
import { ROUTES } from "@/constants/routes";
import { USER_STATUS } from "@/constants/userRoles";
import {
  isBlockedEitherWay,
} from "@/lib/db/messageBlocks";
import {
  buildConversationListItem,
  mapConversation,
  mapMessageWithSender,
  orderedUserPair,
  type ConversationRow,
  type MessageRow,
  type MessageWithProfileRow,
} from "@/lib/db/mappers/message";
import { type ProfileRow } from "@/lib/db/mappers/profile";
import { createNotification } from "@/lib/db/notifications";
import { getProfileById } from "@/lib/db/profiles";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type Conversation,
  type ConversationListItem,
  type MessageAppealListItem,
  type MessageWithSender,
} from "@/types/message";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveReportsForTarget } from "@/lib/db/reports";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { logAdminAction } from "@/lib/db/reports";

function assertDistinctUsers(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw new DbError("不能与自己私信", "VALIDATION");
  }
}

async function assertUserCanReceiveMessages(otherUserId: string): Promise<void> {
  const profile = await getProfileById(otherUserId);
  if (!profile) {
    throw new DbError("用户不存在", "VALIDATION");
  }
  if (profile.status === USER_STATUS.banned && !profile.bannedUntil) {
    throw new DbError("对方账号暂不可接收私信", "VALIDATION");
  }
}

async function ensureConversationMembers(
  conversationId: string,
  userLowId: string,
  userHighId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);

  if (error) {
    throw new DbError(error.message);
  }

  const existing = new Set(
    ((data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
  );
  const missing = [userLowId, userHighId].filter((id) => !existing.has(id));
  if (missing.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("conversation_members").insert(
    missing.map((userId) => ({
      conversation_id: conversationId,
      user_id: userId,
    })),
  );

  if (insertError) {
    throw new DbError(insertError.message);
  }
}

export async function getConversationById(
  conversationId: string,
  userId: string,
): Promise<Conversation | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    return null;
  }

  const row = data as ConversationRow;
  if (row.user_low_id !== userId && row.user_high_id !== userId) {
    return null;
  }

  return mapConversation(row);
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
): Promise<Conversation> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  assertDistinctUsers(userId, otherUserId);
  await assertUserCanReceiveMessages(otherUserId);

  if (await isBlockedEitherWay(userId, otherUserId)) {
    throw new DbError("无法与该用户建立私信", "VALIDATION");
  }

  const [userLowId, userHighId] = orderedUserPair(userId, otherUserId);
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_low_id", userLowId)
    .eq("user_high_id", userHighId)
    .maybeSingle();

  if (existingError) {
    throw new DbError(existingError.message);
  }

  if (existing) {
    await ensureConversationMembers(
      (existing as ConversationRow).id,
      userLowId,
      userHighId,
    );
    return mapConversation(existing as ConversationRow);
  }

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      user_low_id: userLowId,
      user_high_id: userHighId,
    })
    .select("*")
    .single();

  if (createError || !created) {
    if (createError?.code === "23505") {
      const { data: raced } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_low_id", userLowId)
        .eq("user_high_id", userHighId)
        .maybeSingle();
      if (raced) {
        return mapConversation(raced as ConversationRow);
      }
    }
    throw new DbError(createError?.message ?? "创建会话失败");
  }

  const conversation = mapConversation(created as ConversationRow);
  const memberRows = [
    { conversation_id: conversation.id, user_id: userLowId },
    { conversation_id: conversation.id, user_id: userHighId },
  ];

  const { error: memberError } = await supabase
    .from("conversation_members")
    .insert(memberRows);

  if (memberError) {
    throw new DbError(memberError.message);
  }

  return conversation;
}

export async function listConversations(
  userId: string,
  options: { search?: string } = {},
): Promise<ConversationListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`user_low_id.eq.${userId},user_high_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error || !data) {
    throw new DbError(error?.message ?? "加载会话失败");
  }

  const rows = data as ConversationRow[];
  if (rows.length === 0) {
    return [];
  }

  const conversationIds = rows.map((row) => row.id);
  const otherUserIds = rows.map((row) =>
    row.user_low_id === userId ? row.user_high_id : row.user_low_id,
  );

  const [profilesResult, membersResult, unreadResult] = await Promise.all([
    supabase.from("profiles").select("*").in("id", otherUserIds),
    supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId)
      .in("conversation_id", conversationIds),
    supabase
      .from("messages")
      .select("conversation_id, created_at, sender_id")
      .in("conversation_id", conversationIds)
      .neq("sender_id", userId)
      .is("deleted_at", null),
  ]);

  const profileById = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((row) => [row.id, row]),
  );
  const lastReadByConversation = new Map(
    (
      (membersResult.data ?? []) as Array<{
        conversation_id: string;
        last_read_at: string;
      }>
    ).map((row) => [row.conversation_id, row.last_read_at]),
  );

  const unreadByConversation = new Map<string, number>();
  for (const row of (unreadResult.data ?? []) as Array<{
    conversation_id: string;
    created_at: string;
    sender_id: string;
  }>) {
    const lastRead = lastReadByConversation.get(row.conversation_id);
    if (!lastRead || row.created_at > lastRead) {
      unreadByConversation.set(
        row.conversation_id,
        (unreadByConversation.get(row.conversation_id) ?? 0) + 1,
      );
    }
  }

  return rows.map((row) => {
    const otherUserId =
      row.user_low_id === userId ? row.user_high_id : row.user_low_id;
    const item = buildConversationListItem({
      conversation: row,
      currentUserId: userId,
      otherProfile: profileById.get(otherUserId) ?? null,
      unreadCount: unreadByConversation.get(row.id) ?? 0,
    });
    return item;
  }).filter((item) => {
    if (!options.search?.trim()) {
      return true;
    }
    const q = options.search.trim().toLowerCase();
    const name = (
      item.otherUser.displayName ??
      item.otherUser.username ??
      ""
    ).toLowerCase();
    const preview = (item.lastMessagePreview ?? "").toLowerCase();
    return name.includes(q) || preview.includes(q);
  });
}

async function recalculateConversationPreview(
  conversationId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("messages")
    .select("body, content_type, attachment_urls")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    await admin
      .from("conversations")
      .update({ last_message_preview: null, last_message_at: null })
      .eq("id", conversationId);
    return;
  }

  const row = data as {
    body: string | null;
    content_type: string;
    attachment_urls: string[];
  };
  const preview = previewLabelForMessage({
    body: row.body,
    contentType: row.content_type as MessageContentType,
    attachmentCount: row.attachment_urls?.length ?? 0,
  });

  await admin
    .from("conversations")
    .update({ last_message_preview: preview })
    .eq("id", conversationId);
}

export async function getOtherMemberReadAt(
  conversationId: string,
  userId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return null;
  }

  const otherUserId =
    conversation.userLowId === userId
      ? conversation.userHighId
      : conversation.userLowId;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversation_members")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", otherUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as { last_read_at: string }).last_read_at;
}

export async function searchMessagesInConversation(
  conversationId: string,
  userId: string,
  query: string,
  limit = 30,
): Promise<MessageWithSender[]> {
  if (!isSupabaseConfigured() || !query.trim()) {
    return [];
  }

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .ilike("body", `%${query.trim()}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = (data as MessageRow[]).reverse();
  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", senderIds);

  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((row) => [row.id, row]),
  );

  const messages = rows.map((row) =>
    mapMessageWithSender({
      ...row,
      profiles: profileById.get(row.sender_id) ?? null,
    }),
  );

  return messages;
}

export async function recallMessage(
  messageId: string,
  userId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .eq("sender_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("消息不存在或无法撤回", "VALIDATION");
  }

  const row = data as MessageRow;
  const createdAt = new Date(row.created_at).getTime();
  if (Date.now() - createdAt > MESSAGE_LIMITS.recallWindowMs) {
    throw new DbError("已超过撤回时限", "VALIDATION");
  }

  const conversation = await getConversationById(row.conversation_id, userId);
  if (!conversation) {
    throw new DbError("无权撤回", "FORBIDDEN");
  }

  const { error: updateError } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", userId);

  if (updateError) {
    throw new DbError(updateError.message);
  }

  await recalculateConversationPreview(row.conversation_id);
}

export async function listMessages(
  conversationId: string,
  userId: string,
  options: { limit?: number; before?: string } = {},
): Promise<MessageWithSender[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    throw new DbError("会话不存在或无权访问", "FORBIDDEN");
  }

  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(options.limit ?? 50);

  if (options.before) {
    query = query.lt("created_at", options.before);
  }

  const { data, error } = await query;
  if (error) {
    throw new DbError(error.message);
  }

  const rows = (data ?? []) as MessageRow[];
  if (rows.length === 0) {
    return [];
  }

  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", senderIds);

  if (profileError) {
    throw new DbError(profileError.message);
  }

  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((row) => [row.id, row]),
  );

  return rows.map((row) =>
    mapMessageWithSender({
      ...row,
      profiles: profileById.get(row.sender_id) ?? null,
    }),
  );
}

export async function syncConversationMessages(
  conversationId: string,
  userId: string,
): Promise<MessageWithSender[]> {
  return listMessages(conversationId, userId, {
    limit: MESSAGE_LIMITS.messagesPageSize,
  });
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body: string | null;
  contentType: MessageContentType;
  attachmentUrls: string[];
  attachmentMimeTypes: string[];
  quoteMessageId?: string | null;
}): Promise<MessageWithSender> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const conversation = await getConversationById(
    input.conversationId,
    input.senderId,
  );
  if (!conversation) {
    throw new DbError("会话不存在或无权发送", "FORBIDDEN");
  }

  const recipientId =
    conversation.userLowId === input.senderId
      ? conversation.userHighId
      : conversation.userLowId;

  if (await isBlockedEitherWay(input.senderId, recipientId)) {
    throw new DbError("无法向该用户发送私信", "VALIDATION");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      body: input.body,
      content_type: input.contentType,
      attachment_urls: input.attachmentUrls,
      attachment_mime_types: input.attachmentMimeTypes,
      quote_message_id: input.quoteMessageId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "发送失败");
  }

  const row = data as MessageRow;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", input.senderId)
    .maybeSingle();

  const message = mapMessageWithSender({
    ...row,
    profiles: (profile as ProfileRow | null) ?? null,
  });
  const preview = previewLabelForMessage({
    body: input.body,
    contentType: input.contentType,
    attachmentCount: input.attachmentUrls.length,
  });
  const now = new Date().toISOString();

  await supabase
    .from("conversations")
    .update({
      last_message_at: now,
      last_message_preview: preview,
    })
    .eq("id", input.conversationId);

  const senderProfile = message.sender;
  await createNotification({
    userId: recipientId,
    type: NOTIFICATION_TYPES.directMessage,
    title: `${senderProfile.displayName ?? senderProfile.username ?? "同学"} 发来私信`,
    body: preview,
    link: ROUTES.messages.conversation(input.conversationId),
    metadata: {
      conversationId: input.conversationId,
      messageId: message.id,
      senderId: input.senderId,
    },
  });

  return message;
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return;
  }

  const supabase = await createClient();
  const { data: memberRow, error: memberSelectError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberSelectError) {
    throw new DbError(memberSelectError.message);
  }

  const now = new Date().toISOString();
  if (!memberRow) {
    await ensureConversationMembers(
      conversationId,
      conversation.userLowId,
      conversation.userHighId,
    );
  }

  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new DbError(error.message);
  }
}

export async function countUnreadMessages(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createClient();
  const { data: memberships, error: memberError } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  if (memberError || !memberships?.length) {
    return 0;
  }

  let total = 0;
  for (const membership of memberships as Array<{
    conversation_id: string;
    last_read_at: string;
  }>) {
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", membership.conversation_id)
      .neq("sender_id", userId)
      .is("deleted_at", null)
      .gt("created_at", membership.last_read_at);

    if (error) {
      continue;
    }
    total += count ?? 0;
  }

  return total;
}

export async function listMessagesSince(
  conversationId: string,
  userId: string,
  since: string,
): Promise<MessageWithSender[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const conversation = await getConversationById(conversationId, userId);
  if (!conversation) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .gt("created_at", since)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  const rows = data as MessageRow[];
  if (rows.length === 0) {
    return [];
  }

  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", senderIds);

  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((row) => [row.id, row]),
  );

  return rows.map((row) =>
    mapMessageWithSender({
      ...row,
      profiles: profileById.get(row.sender_id) ?? null,
    }),
  );
}

async function mapMessageRowsWithProfiles(
  rows: MessageRow[],
  options: { revealHiddenContent?: boolean } = {},
): Promise<MessageWithSender[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", senderIds);

  if (profileError) {
    throw new DbError(profileError.message);
  }

  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((row) => [row.id, row]),
  );

  return rows.map((row) =>
    mapMessageWithSender(
      {
        ...row,
        profiles: profileById.get(row.sender_id) ?? null,
      },
      options,
    ),
  );
}

export async function getMessageForConversationMember(
  messageId: string,
  userId: string,
): Promise<MessageWithSender | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as MessageRow;
  const conversation = await getConversationById(row.conversation_id, userId);
  if (!conversation) {
    return null;
  }

  const [message] = await mapMessageRowsWithProfiles([row]);
  return message ?? null;
}

export async function getMessageContextWindow(
  messageId: string,
  userId: string,
  radius = 5,
): Promise<{
  reported: MessageWithSender;
  context: MessageWithSender[];
} | null> {
  const reported = await getMessageForConversationMember(messageId, userId);
  if (!reported) {
    return null;
  }

  const supabase = await createClient();
  const [beforeResult, afterResult] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", reported.conversationId)
      .is("deleted_at", null)
      .lt("created_at", reported.createdAt)
      .order("created_at", { ascending: false })
      .limit(radius),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", reported.conversationId)
      .is("deleted_at", null)
      .gt("created_at", reported.createdAt)
      .order("created_at", { ascending: true })
      .limit(radius),
  ]);

  if (beforeResult.error || afterResult.error) {
    throw new DbError(
      beforeResult.error?.message ??
        afterResult.error?.message ??
        "加载上下文失败",
    );
  }

  const beforeRows = ((beforeResult.data ?? []) as MessageRow[]).reverse();
  const afterRows = (afterResult.data ?? []) as MessageRow[];
  const context = await mapMessageRowsWithProfiles([
    ...beforeRows,
    ...afterRows,
  ]);

  return { reported, context };
}

export async function submitMessageAppeal(input: {
  messageId: string;
  senderId: string;
  appealNote: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const message = await getMessageForConversationMember(
    input.messageId,
    input.senderId,
  );
  if (!message || message.senderId !== input.senderId) {
    throw new DbError("消息不存在或无权申诉", "VALIDATION");
  }
  if (!message.moderationHiddenAt) {
    throw new DbError("该消息当前不可申诉", "VALIDATION");
  }
  if (message.appealStatus === ARCHIVE_APPEAL_STATUS.pending) {
    throw new DbError("申诉已提交，请等待管理员审核", "VALIDATION");
  }
  if (message.appealStatus === ARCHIVE_APPEAL_STATUS.approved) {
    throw new DbError("该消息申诉已通过", "VALIDATION");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("messages")
    .update({
      appeal_status: ARCHIVE_APPEAL_STATUS.pending,
      appeal_note: input.appealNote,
      appeal_submitted_at: now,
    })
    .eq("id", input.messageId)
    .eq("sender_id", input.senderId)
    .not("moderation_hidden_at", "is", null)
    .in("appeal_status", [
      ARCHIVE_APPEAL_STATUS.none,
      ARCHIVE_APPEAL_STATUS.rejected,
    ])
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("无法提交申诉，请稍后重试", "VALIDATION");
  }
}

export async function listPendingMessageAppeals(
  limit = 50,
): Promise<MessageAppealListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
    .not("moderation_hidden_at", "is", null)
    .order("appeal_submitted_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  const rows = data as MessageRow[];
  const messages = await mapMessageRowsWithProfiles(rows, {
    revealHiddenContent: true,
  });
  return messages.map((message, index) => ({
    ...message,
    appealNote: rows[index]?.appeal_note ?? null,
    appealSubmittedAt: rows[index]?.appeal_submitted_at ?? null,
  }));
}

export async function countPendingMessageAppeals(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
    .not("moderation_hidden_at", "is", null);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function approveMessageAppeal(input: {
  messageId: string;
  adminId: string;
  reason: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .update({
      moderation_hidden_at: null,
      appeal_status: ARCHIVE_APPEAL_STATUS.approved,
    })
    .eq("id", input.messageId)
    .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
    .not("moderation_hidden_at", "is", null)
    .select("sender_id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("申诉不存在或已处理");
  }

  await resolveReportsForTarget(
    TARGET_TYPES.message,
    input.messageId,
    input.adminId,
  );

  await logAdminAction({
    adminId: input.adminId,
    action: "approve_message_appeal",
    targetType: TARGET_TYPES.message,
    targetId: input.messageId,
    metadata: { reason: input.reason },
  });

  await createNotification({
    userId: data.sender_id as string,
    type: NOTIFICATION_TYPES.messageAppealApproved,
    title: "私信申诉已通过",
    body: "管理员已通过您的申诉，相关私信已恢复显示。",
    link: ROUTES.messages.list,
    metadata: { messageId: input.messageId },
  });
}

export async function rejectMessageAppeal(input: {
  messageId: string;
  adminId: string;
  reason: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .update({
      appeal_status: ARCHIVE_APPEAL_STATUS.rejected,
    })
    .eq("id", input.messageId)
    .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
    .not("moderation_hidden_at", "is", null)
    .select("sender_id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("申诉不存在或已处理");
  }

  await logAdminAction({
    adminId: input.adminId,
    action: "reject_message_appeal",
    targetType: TARGET_TYPES.message,
    targetId: input.messageId,
    metadata: { reason: input.reason },
  });

  await createNotification({
    userId: data.sender_id as string,
    type: NOTIFICATION_TYPES.messageAppealRejected,
    title: "私信申诉未通过",
    body: "管理员已驳回您的申诉，该私信将继续隐藏。",
    link: ROUTES.messages.list,
    metadata: { messageId: input.messageId },
  });
}
