"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  completeFirstSetup,
  submitProfileForReview,
} from "@/lib/db/profiles";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  firstSetupSchema,
  nicknameOptionalSchema,
  changePasswordWithOtpSchema,
} from "@/lib/validations/authSchema";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { isDevShowLoginOtp } from "@/lib/auth/devLoginOtp";
import { createOtpChallenge, verifyOtpChallenge } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email/sendOtpEmail";
import { createClient } from "@/lib/supabase/server";
import { uploadAvatarFromFormData } from "@/lib/profile/uploadAvatar";
import {
  OTP_SPAM_HINT,
  isAllowedPolyuEmail,
} from "@/constants/auth";
import { z } from "zod";
import { STUDENT_GRADES } from "@/constants/profileOptions";

const gradeIds = STUDENT_GRADES.map((item) => item.id) as [string, ...string[]];

export type OnboardingFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<
    Record<"nickname" | "grade" | "major" | "avatarUrl" | "displayName" | "username", string>
  >;
};

export async function completeOnboardingAction(
  _prevState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置，无法保存资料。" };
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  const parsed = firstSetupSchema.safeParse({
    grade: formData.get("grade"),
    major: formData.get("major"),
    nickname: formData.get("nickname") || formData.get("displayName") || "",
    avatarUrl: formData.get("avatarUrl") || "",
  });

  if (!parsed.success) {
    const fieldErrors: OnboardingFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (
        field === "nickname" ||
        field === "grade" ||
        field === "major" ||
        field === "avatarUrl"
      ) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  const avatarFile = formData.get("avatar");
  let avatarUrl = parsed.data.avatarUrl?.trim() || "";

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const upload = await uploadAvatarFromFormData(user.id, avatarFile);
    if (!upload.ok) {
      return { error: upload.error };
    }
    avatarUrl = upload.publicUrl;
  }

  try {
    await completeFirstSetup(user.id, {
      ...parsed.data,
      avatarUrl,
    });
    revalidatePath("/", "layout");
    redirect(ROUTES.home);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "保存资料失败，请稍后重试";

    if (message.includes("昵称")) {
      return { fieldErrors: { nickname: message }, error: message };
    }

    return { error: message };
  }
}

const profileDisplayUpdateSchema = z.object({
  nickname: nicknameOptionalSchema,
  grade: z.enum(gradeIds).optional(),
  major: z
    .string()
    .trim()
    .min(1, "请填写专业")
    .max(100, "专业名称过长")
    .optional(),
});

/** 个人主页：修改昵称/头像（进审核）及年级/专业 */
export async function updateOwnProfileAction(
  _prevState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  const gradeRaw = String(formData.get("grade") ?? "").trim();
  const majorRaw = String(formData.get("major") ?? "").trim();

  const parsed = profileDisplayUpdateSchema.safeParse({
    nickname: formData.get("nickname") ?? "",
    grade: gradeRaw || undefined,
    major: majorRaw || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: OnboardingFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field === "nickname" || field === "grade" || field === "major") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  const file = formData.get("avatar");
  let uploadedAvatarUrl: string | null | undefined;

  if (file instanceof File && file.size > 0) {
    const upload = await uploadAvatarFromFormData(user.id, file);
    if (!upload.ok) {
      return { error: upload.error };
    }
    uploadedAvatarUrl = upload.publicUrl;
  }

  const nicknameChanged =
    parsed.data.nickname.trim() !== (user.profile?.nickname?.trim() ?? "");
  const hasAvatarUpload = uploadedAvatarUrl !== undefined;
  const gradeChanged =
    parsed.data.grade !== undefined &&
    parsed.data.grade !== user.profile?.grade;
  const majorChanged =
    parsed.data.major !== undefined &&
    parsed.data.major.trim() !== (user.profile?.major ?? "").trim();

  if (!nicknameChanged && !hasAvatarUpload && !gradeChanged && !majorChanged) {
    return { error: "请先修改昵称、头像或其他资料" };
  }

  try {
    const result = await submitProfileForReview(user.id, {
      ...(nicknameChanged ? { nickname: parsed.data.nickname } : {}),
      ...(hasAvatarUpload ? { avatarUrl: uploadedAvatarUrl ?? null } : {}),
      ...(gradeChanged ? { grade: parsed.data.grade } : {}),
      ...(majorChanged ? { major: parsed.data.major } : {}),
    });
    revalidatePath(ROUTES.profile(user.id));
    revalidatePath("/", "layout");
    return {
      success:
        result.riskMessage ??
        (nicknameChanged || hasAvatarUpload
          ? "资料已更新"
          : "资料已更新"),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新失败，请稍后重试";
    return { error: message };
  }
}

export type ChangePasswordFormState = {
  error?: string;
  success?: string;
  step?: "send_otp" | "set_password" | "done";
  resendAvailableAt?: string;
  /** 仅 DEV_SHOW_LOGIN_OTP=true 时返回 */
  devInfo?: { email: string; otp: string } | null;
  fieldErrors?: Partial<
    Record<"otp" | "password" | "confirmPassword", string>
  >;
};

/** 向绑定邮箱发送修改密码验证码 */
export async function sendChangePasswordOtpAction(
  _prevState: ChangePasswordFormState,
  _formData: FormData,
): Promise<ChangePasswordFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  const email = user.email?.trim().toLowerCase();
  if (!email || !isAllowedPolyuEmail(email)) {
    return { error: "账号未绑定有效的理大邮箱，无法修改密码" };
  }

  const created = await createOtpChallenge(email, "change_password");
  if (!created.ok) {
    return {
      error: created.error,
      resendAvailableAt: created.resendAvailableAt,
      step: "send_otp",
    };
  }

  const sent = await sendOtpEmail({
    email,
    code: created.code,
    purpose: "change_password",
  });

  if (!sent.ok) {
    return { error: sent.error, step: "send_otp" };
  }

  return {
    success: `验证码已发送至 ${email}。${OTP_SPAM_HINT}`,
    step: "set_password",
    resendAvailableAt: created.resendAvailableAt,
    devInfo: isDevShowLoginOtp() ? { email, otp: created.code } : null,
  };
}

/** 验证邮箱 OTP 后设置新密码 */
export async function changePasswordWithOtpAction(
  _prevState: ChangePasswordFormState,
  formData: FormData,
): Promise<ChangePasswordFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return { error: "账号未绑定邮箱，无法修改密码", step: "send_otp" };
  }

  const parsed = changePasswordWithOtpSchema.safeParse({
    otp: formData.get("otp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: ChangePasswordFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field === "otp" || field === "password" || field === "confirmPassword") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查输入", step: "set_password" };
  }

  const otpResult = await verifyOtpChallenge(
    email,
    "change_password",
    parsed.data.otp,
  );

  if (!otpResult.ok) {
    return {
      error: otpResult.error,
      fieldErrors: { otp: otpResult.error },
      step: "set_password",
    };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (updateError) {
    return {
      error: mapAuthErrorMessage(updateError.message),
      step: "set_password",
    };
  }

  return {
    success: "密码已更新，下次登录请使用新密码",
    step: "done",
    devInfo: null,
  };
}
