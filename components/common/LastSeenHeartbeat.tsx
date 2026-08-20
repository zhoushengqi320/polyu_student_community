"use client";

import { useEffect, useRef } from "react";
import { touchLastSeenAction } from "@/lib/profile/lastSeenActions";

const STORAGE_KEY = "polyuhub:last-seen-heartbeat";
const THROTTLE_MS = 30 * 60 * 1000;

/** 登录后低频更新 last_seen，替代 middleware 写库 */
export function LastSeenHeartbeat() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    try {
      const prev = Number(sessionStorage.getItem(STORAGE_KEY) || "0");
      if (Date.now() - prev < THROTTLE_MS) {
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }

    void touchLastSeenAction();
  }, []);

  return null;
}
