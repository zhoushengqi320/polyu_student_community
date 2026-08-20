import { cache } from "react";
import { getProfileById } from "@/lib/db/profiles";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type SessionUser } from "@/types/user";

/** 同一请求内去重，避免 layout + page 重复拉会话 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const profile = await getProfileById(user.id);

    return {
      id: user.id,
      email: user.email ?? null,
      profile,
    };
  } catch {
    return null;
  }
});
