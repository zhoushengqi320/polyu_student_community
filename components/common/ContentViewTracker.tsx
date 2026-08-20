"use client";

import { useEffect, useRef } from "react";
import { recordContentViewAction } from "@/lib/content/viewActions";
import { type TargetType } from "@/constants/reportReasons";

type ContentViewTrackerProps = {
  targetType: TargetType;
  targetId: string;
};

/** 详情页挂载时记录浏览，避免列表预取虚增 */
export function ContentViewTracker({
  targetType,
  targetId,
}: ContentViewTrackerProps) {
  const recordedRef = useRef(false);

  useEffect(() => {
    if (recordedRef.current) {
      return;
    }
    recordedRef.current = true;
    void recordContentViewAction({ targetType, targetId });
  }, [targetType, targetId]);

  return null;
}
