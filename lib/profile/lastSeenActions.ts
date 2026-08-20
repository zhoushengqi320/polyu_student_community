"use server";

import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const HEARTBEAT_THROTTLE_MS = 30 * 60 * 1000;

/** 登录用户低频心跳，更新 last_seen_at（不走 middleware，避免拖慢每个请求） */
export async function touchLastSeenAction(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const user = await getSessionUser();
  if (!user) {
    return;
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const throttleBefore = new Date(Date.now() - HEARTBEAT_THROTTLE_MS).toISOString();

  await supabase
    .from("profiles")
    .update({ last_seen_at: nowIso })
    .eq("id", user.id)
    .or(`last_seen_at.is.null,last_seen_at.lt."${throttleBefore}"`);
}
