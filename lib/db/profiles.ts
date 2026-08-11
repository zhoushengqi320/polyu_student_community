import { mapProfile } from "@/lib/db/mappers/profile";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PROFILE_REVIEW_STATUS } from "@/constants/profileReview";
import { type FirstSetupFormValues } from "@/lib/validations/authSchema";
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

export async function isNicknameAvailable(
  nickname: string,
  excludeUserId?: string,
): Promise<boolean> {
  if (!nickname.trim()) {
    return true;
  }

  if (!isSupabaseConfigured()) {
    return false;
  }

  const admin = createAdminClient();
  const normalized = nickname.trim();

  let pendingQuery = admin
    .from("profiles")
    .select("id")
    .ilike("nickname", normalized)
    .limit(1);
  let approvedQuery = admin
    .from("profiles")
    .select("id")
    .ilike("approved_nickname", normalized)
    .limit(1);

  if (excludeUserId) {
    pendingQuery = pendingQuery.neq("id", excludeUserId);
    approvedQuery = approvedQuery.neq("id", excludeUserId);
  }

  const [{ data: pending }, { data: approved }] = await Promise.all([
    pendingQuery,
    approvedQuery,
  ]);

  return (!pending || pending.length === 0) && (!approved || approved.length === 0);
}

/** @deprecated */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  return isNicknameAvailable(username, excludeUserId);
}

export async function completeFirstSetup(
  userId: string,
  input: FirstSetupFormValues,
): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const nickname = input.nickname?.trim() || "";
  const avatarUrl = input.avatarUrl?.trim() || "";

  if (nickname) {
    const available = await isNicknameAvailable(nickname, userId);
    if (!available) {
      throw new DbError("该昵称已被占用，请换一个");
    }
  }

  const hasSubmission = Boolean(nickname || avatarUrl);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      grade: input.grade,
      major: input.major.trim(),
      nickname: nickname || null,
      avatar_url: avatarUrl || null,
      display_name: nickname || null,
      approved_nickname: null,
      approved_avatar_url: null,
      profile_review_status: hasSubmission
        ? PROFILE_REVIEW_STATUS.pending
        : PROFILE_REVIEW_STATUS.approved,
      review_reason: null,
      is_first_setup_completed: true,
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

export async function submitProfileForReview(
  userId: string,
  input: {
    nickname?: string;
    avatarUrl?: string | null;
    grade?: string;
    major?: string;
  },
): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const nicknameProvided = input.nickname !== undefined;
  const avatarProvided = input.avatarUrl !== undefined;
  const nickname = nicknameProvided ? input.nickname?.trim() || "" : undefined;
  const avatarUrl = avatarProvided ? input.avatarUrl?.trim() || "" : undefined;

  if (nickname) {
    const available = await isNicknameAvailable(nickname, userId);
    if (!available) {
      throw new DbError("该昵称已被占用，请换一个");
    }
  }

  const payload: Record<string, unknown> = {};

  if (input.grade) {
    payload.grade = input.grade;
  }
  if (input.major !== undefined) {
    payload.major = input.major.trim();
  }

  if (nicknameProvided) {
    payload.nickname = nickname || null;
    payload.display_name = nickname || null;
  }

  if (avatarProvided) {
    payload.avatar_url = avatarUrl || null;
  }

  const hasReviewSubmission =
    (nicknameProvided && Boolean(nickname)) ||
    (avatarProvided && Boolean(avatarUrl));

  if (hasReviewSubmission) {
    payload.profile_review_status = PROFILE_REVIEW_STATUS.pending;
    payload.review_reason = null;
  }

  if (Object.keys(payload).length === 0) {
    throw new DbError("没有可保存的修改");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "更新资料失败");
  }

  return mapProfile(data);
}

export async function updateProfile(
  id: string,
  input: Partial<
    Pick<Profile, "bio" | "grade" | "major">
  >,
): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    throw new Error("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      bio: input.bio,
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
