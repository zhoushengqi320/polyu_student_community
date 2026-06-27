import { mapProfile } from "@/lib/db/mappers/profile";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type OnboardingFormValues } from "@/lib/validations/authSchema";
import { type Profile } from "@/types/user";

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfile(data);
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return getProfileById(user.id);
}

export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .limit(1);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data } = await query;
  return !data || data.length === 0;
}

export async function completeOnboarding(
  userId: string,
  input: OnboardingFormValues,
): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const available = await isUsernameAvailable(input.username, userId);
  if (!available) {
    throw new DbError("该用户名已被占用，请换一个");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      username: input.username.trim(),
      display_name: input.displayName.trim(),
      grade: input.grade,
      major: input.major.trim(),
      onboarding_completed: true,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "保存资料失败");
  }

  return mapProfile(data);
}

export async function updateProfile(
  id: string,
  input: Partial<
    Pick<Profile, "displayName" | "bio" | "avatarUrl" | "grade" | "major">
  >,
): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    throw new Error("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      bio: input.bio,
      avatar_url: input.avatarUrl,
      grade: input.grade,
      major: input.major,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "更新资料失败");
  }

  return mapProfile(data);
}
