"use client";

import { useState } from "react";
import { ForumPostsTable } from "@/components/admin/ForumPostsTable";
import { ForumCommentsTable } from "@/components/admin/ForumCommentsTable";
import { cn } from "@/lib/utils/cn";
import { type AdminForumCommentListItem, type AdminForumPostListItem } from "@/types/admin";

type CommunityContentTabsProps = {
  forumPosts: AdminForumPostListItem[];
  forumComments: AdminForumCommentListItem[];
};

const SECTIONS = [
  { id: "posts", label: "帖子" },
  { id: "comments", label: "评论" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function CommunityContentTabs({
  forumPosts,
  forumComments,
}: CommunityContentTabsProps) {
  const [active, setActive] = useState<SectionId>("posts");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-1">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActive(section.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              active === section.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>

      {active === "posts" ? <ForumPostsTable posts={forumPosts} /> : null}
      {active === "comments" ? (
        <ForumCommentsTable comments={forumComments} />
      ) : null}
    </div>
  );
}
