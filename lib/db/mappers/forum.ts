import {
  mapProfileListItem,
  type ProfileRow,
} from "@/lib/db/mappers/profile";
import {
  type ForumPost,
  type ForumPostDetail,
  type ForumPostListItem,
} from "@/types/forum";
import { type Database } from "@/types/database";

export type ForumPostRow = Database["public"]["Tables"]["posts"]["Row"] & {
  excerpt?: string | null;
  topics?: string[] | null;
  like_count?: number | null;
  comment_count?: number | null;
  view_count?: number | null;
  is_anonymous?: boolean | null;
};

export type ForumPostWithProfileRow = ForumPostRow & {
  profiles: ProfileRow;
};

function readCount(value: number | null | undefined): number {
  return value ?? 0;
}

export function mapForumPost(row: ForumPostRow): ForumPost {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt ?? null,
    categoryId: row.category_id,
    topics: row.topics ?? [],
    likeCount: readCount(row.like_count),
    commentCount: readCount(row.comment_count),
    viewCount: readCount(row.view_count),
    isAnonymous: row.is_anonymous ?? false,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuthor(row: ForumPostWithProfileRow) {
  if (row.is_anonymous) {
    return {
      id: row.user_id,
      username: "anonymous",
      displayName: "匿名用户",
      avatarUrl: null,
      role: row.profiles.role,
    };
  }

  return mapProfileListItem(row.profiles);
}

export function mapForumPostListItem(row: ForumPostWithProfileRow): ForumPostListItem {
  const post = mapForumPost(row);
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    topics: post.topics,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    viewCount: post.viewCount,
    isAnonymous: post.isAnonymous,
    createdAt: post.createdAt,
    author: mapAuthor(row),
  };
}

export function mapForumPostDetail(row: ForumPostWithProfileRow): ForumPostDetail {
  return {
    ...mapForumPost(row),
    author: mapAuthor(row),
  };
}

export function buildPostExcerpt(content: string, maxLength = 160): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}…`;
}
