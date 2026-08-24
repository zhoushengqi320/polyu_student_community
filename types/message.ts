import { type MessageContentType } from "@/constants/messaging";
import { type ArchiveAppealStatus } from "@/constants/moderation";
import { type ProfileListItem } from "@/types/user";

export type Conversation = {
  id: string;
  userLowId: string;
  userHighId: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationListItem = {
  id: string;
  otherUser: ProfileListItem;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  isBlockedByMe?: boolean;
  hasBlockedMe?: boolean;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  contentType: MessageContentType;
  attachmentUrls: string[];
  attachmentMimeTypes: string[];
  createdAt: string;
  updatedAt: string;
  quoteMessageId: string | null;
  moderationHiddenAt: string | null;
  appealStatus: ArchiveAppealStatus;
};

export type MessageWithSender = Message & {
  sender: ProfileListItem;
};

export type MessageAppealListItem = MessageWithSender & {
  appealNote: string | null;
  appealSubmittedAt: string | null;
};

export type OwnHiddenMessageItem = {
  id: string;
  conversationId: string;
  createdAt: string;
  appealStatus: ArchiveAppealStatus;
  otherUser: ProfileListItem;
};
