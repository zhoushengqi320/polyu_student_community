import { OFFICIAL_CONTENT_AUTHOR_NAME } from "@/constants/site";
import { type UserRole } from "@/constants/userRoles";

type ContentAuthorLike = {
  role?: UserRole | string | null;
  displayName?: string | null;
  username?: string | null;
};

/**
 * 内容作者展示名：管理员发布的指南/攻略统一显示 PolyUHub；
 * 评论等互动仍用真实昵称，勿对本函数用于评论作者。
 */
export function getContentAuthorDisplayName(
  author: ContentAuthorLike | null | undefined,
): string {
  if (author?.role === "admin") {
    return OFFICIAL_CONTENT_AUTHOR_NAME;
  }

  return (
    author?.displayName?.trim() ||
    author?.username?.trim() ||
    OFFICIAL_CONTENT_AUTHOR_NAME
  );
}
