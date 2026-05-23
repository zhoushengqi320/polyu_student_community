import { getProfileById } from "@/lib/db/profiles";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type SessionUser } from "@/types/user";

export async function getSessionUser(): Promise<SessionUser | null> {
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
}
