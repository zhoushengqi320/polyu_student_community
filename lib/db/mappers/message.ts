import { type MessageContentType } from "@/constants/messaging";
import { ARCHIVE_APPEAL_STATUS, type ArchiveAppealStatus } from "@/constants/moderation";
import {
  mapProfileListItemOrFallback,
  type ProfileRow,
} from "@/lib/db/mappers/profile";
import {
  type Conversation,
  type ConversationListItem,
  type Message,
  type MessageWithSender,
} from "@/types/message";

export type ConversationRow = {
  id: string;
  user_low_id: string;
  user_high_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
};

export type ConversationMemberRow = {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  content_type: string;
  attachment_urls: string[] | null;
  attachment_mime_types: string[] | null;
  created_at: string;
  deleted_at: string | null;
  moderation_hidden_at?: string | null;
  appeal_status?: string | null;
  appeal_note?: string | null;
  appeal_submitted_at?: string | null;
  quote_message_id?: string | null;
  updated_at?: string;
};

export type MessageWithProfileRow = MessageRow & {
  profiles: ProfileRow | null;
};

export function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userLowId: row.user_low_id,
    userHighId: row.user_high_id,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMessage(
  row: MessageRow,
  options: { revealHiddenContent?: boolean } = {},
): Message {
  const hidden = Boolean(row.moderation_hidden_at);
  const reveal = options.revealHiddenContent === true;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: hidden && !reveal ? null : row.body,
    contentType: row.content_type as MessageContentType,
    attachmentUrls:
      hidden && !reveal ? [] : (row.attachment_urls ?? []).filter(Boolean),
    attachmentMimeTypes:
      hidden && !reveal
        ? []
        : (row.attachment_mime_types ?? []).filter(Boolean),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    quoteMessageId: row.quote_message_id ?? null,
    moderationHiddenAt: row.moderation_hidden_at ?? null,
    appealStatus:
      (row.appeal_status as ArchiveAppealStatus | null | undefined) ??
      ARCHIVE_APPEAL_STATUS.none,
  };
}

export function mapMessageWithSender(
  row: MessageWithProfileRow,
  options: { revealHiddenContent?: boolean } = {},
): MessageWithSender {
  return {
    ...mapMessage(row, options),
    sender: mapProfileListItemOrFallback(
      row.profiles,
      row.sender_id,
      "已删除用户",
    ),
  };
}

export function getOtherUserId(
  conversation: Conversation,
  currentUserId: string,
): string {
  return conversation.userLowId === currentUserId
    ? conversation.userHighId
    : conversation.userLowId;
}

export function buildConversationListItem(input: {
  conversation: ConversationRow;
  currentUserId: string;
  otherProfile: ProfileRow | null;
  unreadCount: number;
}): ConversationListItem {
  const conversation = mapConversation(input.conversation);
  const otherUserId = getOtherUserId(conversation, input.currentUserId);
  return {
    id: conversation.id,
    otherUser: mapProfileListItemOrFallback(
      input.otherProfile,
      otherUserId,
      "PolyU 同学",
    ),
    lastMessageAt: conversation.lastMessageAt,
    lastMessagePreview: conversation.lastMessagePreview,
    unreadCount: input.unreadCount,
  };
}

export function orderedUserPair(
  userA: string,
  userB: string,
): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}
