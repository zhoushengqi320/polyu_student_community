"use client";

import { useEffect, useRef } from "react";
import { recordForumPostViewAction } from "@/lib/forum/actions";

type ForumPostViewTrackerProps = {
  postId: string;
};

/** 仅在用户真正打开详情页（客户端挂载）时记录浏览，避免列表预取虚增浏览量 */
export function ForumPostViewTracker({ postId }: ForumPostViewTrackerProps) {
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current) {
      return;
    }
    recordedRef.current = true;
    void recordForumPostViewAction(postId);
  }, [postId]);

  return null;
}
