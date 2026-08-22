import { mapProfile } from "@/lib/db/mappers/profile";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { decideProfileSubmissionRisk } from "@/lib/profile/profileRiskDecision";
import { assessMajorRisk } from "@/lib/moderation/profileRisk";
import { CONTENT_RISK_LEVELS } from "@/constants/moderation";
import { NOTIFICATION_TYPES } from "@/constants/moderation";
import { createNotification } from "@/lib/db/notifications";
import { USER_STATUS } from "@/constants/userRoles";
import { ROUTES } from "@/constants/routes";
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

  const decision = decideProfileSubmissionRisk({
    nickname,
    avatarUrl,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      grade: input.grade,
      major: input.major.trim(),
      nickname: nickname || null,
      avatar_url: avatarUrl || null,
      display_name: decision.autoApprove ? nickname || null : null,
      approved_nickname: decision.autoApprove ? nickname || null : null,
      approved_avatar_url: decision.autoApprove ? avatarUrl || null : null,
      profile_review_status: decision.reviewStatus,
      review_reason: null,
      profile_risk_level: decision.level,
      profile_risk_flags: decision.flags,
      profile_risk_attention: decision.needsAttention,
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

async function banUserForForbiddenMajor(
  userId: string,
  reason: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      status: USER_STATUS.banned,
      major: null,
      profile_risk_attention: false,
      review_reason: reason,
    })
    .eq("id", userId)
    .neq("role", "admin");

  await createNotification({
    userId,
    type: NOTIFICATION_TYPES.profileRejected,
    title: "账号已被限制",
    body: reason,
    link: ROUTES.profile(userId),
  });
}

export async function submitProfileForReview(
  userId: string,
  input: {
    nickname?: string;
    avatarUrl?: string | null;
    grade?: string;
    major?: string;
  },
): Promise<{ profile: Profile; riskMessage?: string }> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const nicknameProvided = input.nickname !== undefined;
  const avatarProvided = input.avatarUrl !== undefined;
  const majorProvided = input.major !== undefined;
  const nickname = nicknameProvided ? input.nickname?.trim() || "" : undefined;
  const avatarUrl = avatarProvided ? input.avatarUrl?.trim() || "" : undefined;
  const major = majorProvided ? input.major?.trim() || "" : undefined;

  if (nickname) {
    const available = await isNicknameAvailable(nickname, userId);
    if (!available) {
      throw new DbError("该昵称已被占用，请换一个");
    }
  }

  if (majorProvided && major) {
    const majorRisk = assessMajorRisk(major);
    if (majorRisk.level === CONTENT_RISK_LEVELS.high) {
      await banUserForForbiddenMajor(
        userId,
        "专业信息含有禁止内容，账号已被限制。如有疑问请联系管理员。",
      );
      throw new DbError("专业信息不符合规范，账号已被限制");
    }
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("profiles")
    .select("nickname, avatar_url, approved_nickname, approved_avatar_url, major")
    .eq("id", userId)
    .single();

  if (currentError || !current) {
    throw new DbError(currentError?.message ?? "用户不存在");
  }

  const payload: Record<string, unknown> = {};

  if (input.grade) {
    payload.grade = input.grade;
  }

  const hasReviewSubmission =
    (nicknameProvided && Boolean(nickname)) ||
    (avatarProvided && Boolean(avatarUrl)) ||
    (majorProvided && Boolean(major));

  let riskMessage: string | undefined;

  if (hasReviewSubmission) {
    const nextNickname = nicknameProvided
      ? nickname || null
      : (current.nickname as string | null);
    const nextAvatar = avatarProvided
      ? avatarUrl || null
      : (current.avatar_url as string | null);
    const nextMajor = majorProvided
      ? major || null
      : (current.major as string | null);

    const decision = decideProfileSubmissionRisk({
      nickname: nextNickname,
      avatarUrl: nextAvatar,
      major: nextMajor,
    });

    if (nicknameProvided) {
      payload.nickname = nickname || null;
    }
    if (avatarProvided) {
      payload.avatar_url = avatarUrl || null;
    }
    if (majorProvided) {
      payload.major = major || null;
    }

    payload.profile_review_status = decision.reviewStatus;
    payload.review_reason = null;
    payload.profile_risk_level = decision.level;
    payload.profile_risk_flags = decision.flags;
    payload.profile_risk_attention = decision.needsAttention;

    if (decision.autoApprove) {
      if (nicknameProvided) {
        payload.approved_nickname = nickname || null;
        payload.display_name = nickname || null;
      }
      if (avatarProvided) {
        payload.approved_avatar_url = avatarUrl || null;
      }
    }

    const { profileRiskUserMessage } = await import(
      "@/lib/profile/profileRiskDecision"
    );
    riskMessage = profileRiskUserMessage();
  } else {
    if (nicknameProvided) {
      payload.nickname = nickname || null;
      payload.display_name = nickname || null;
    }
    if (majorProvided) {
      payload.major = major || null;
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new DbError("没有可保存的修改");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "更新资料失败");
  }

  return { profile: mapProfile(data), riskMessage };
}

export async function updateProfile(
  id: string,
  input: Partial<Pick<Profile, "bio" | "grade" | "major">>,
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

export async function markHomeTourCompleted(
  userId: string,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ home_tour_completed_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function resetHomeTourCompleted(
  userId: string,
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ home_tour_completed_at: null })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  return {};
}
