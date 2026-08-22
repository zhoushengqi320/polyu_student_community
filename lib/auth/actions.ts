"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import {
  OTP_SPAM_HINT,
  REGISTRATION_DRAFT_TTL_MS,
} from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { isDevShowLoginOtp } from "@/lib/auth/devLoginOtp";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import {
  createOtpChallenge,
  decryptPasswordFromDraft,
  encryptPasswordForDraft,
  verifyOtpChallenge,
} from "@/lib/auth/otp";
import {
  clearRegistrationDraftCookie,
  findAuthUserIdByEmail,
  getOrCreateRegistrationDraft,
  getRegistrationDraftByCookie,
  setRegistrationDraftCookie,
} from "@/lib/auth/registrationDraft";
import {
  clearResetVerifiedCookie,
  getResetVerifiedEmail,
  setResetVerifiedCookie,
} from "@/lib/auth/resetPasswordToken";
import { sendOtpEmail } from "@/lib/email/sendOtpEmail";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  firstSetupSchema,
  loginPasswordSchema,
  otpCodeSchema,
  polyuEmailSchema,
  registerEmailSchema,
  setPasswordSchema,
} from "@/lib/validations/authSchema";
import { type ActionResult } from "@/types/common";
import { isNicknameAvailable } from "@/lib/db/profiles";
import { isAllowedPolyuEmail } from "@/constants/auth";
import {
  canStartRegistrationWithEmail,
  consumeWhitelistEmail,
  isActiveWhitelistEmail,
} from "@/lib/db/emailWhitelist";

export type AuthDevInfo = {
  email: string;
  otp: string;
  magicLink?: string;
};

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "email"
      | "otp"
      | "password"
      | "confirmPassword"
      | "grade"
      | "major"
      | "nickname"
      | "avatarUrl",
      string
    >
  >;
  success?: string;
  /** 仅 DEV_SHOW_LOGIN_OTP=true 时返回 */
  devInfo?: AuthDevInfo | null;
  step?: string;
  resendAvailableAt?: string;
  /** 白名单注册：跳过验证码，设密码页展示欢迎语 */
  whitelisted?: boolean;
};

function authUnavailableState(): AuthFormState {
  return {
    error: "认证服务未配置，请先设置环境变量。",
  };
}

function getRedirectTo(): string {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  )
    .trim()
    .replace(/\/+$/, "");
  return `${appUrl}/auth/callback`;
}

function collectFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): AuthFormState["fieldErrors"] {
  const fieldErrors: AuthFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (
      key === "email" ||
      key === "otp" ||
      key === "password" ||
      key === "confirmPassword" ||
      key === "grade" ||
      key === "major" ||
      key === "nickname" ||
      key === "avatarUrl"
    ) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

async function issueOtpAndMaybeEmail(
  email: string,
  purpose: "register" | "login" | "reset_password",
): Promise<AuthFormState> {
  const created = await createOtpChallenge(email, purpose);
  if (!created.ok) {
    return {
      error: created.error,
      resendAvailableAt: created.resendAvailableAt,
    };
  }

  const sent = await sendOtpEmail({
    email,
    code: created.code,
    purpose,
  });

  if (!sent.ok) {
    return { error: sent.error };
  }

  const successBase =
    purpose === "register"
      ? "验证码已发送"
      : purpose === "login"
        ? "登录验证码已发送"
        : "重置密码验证码已发送";

  return {
    success: successBase,
    resendAvailableAt: created.resendAvailableAt,
    step: "otp",
    devInfo: isDevShowLoginOtp()
      ? { email, otp: created.code }
      : null,
  };
}

// ---------- Magic Link（保留，默认不在业务入口调用） ----------

export async function sendMagicLinkAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = polyuEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查邮箱地址",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const redirectTo = getRedirectTo();
  console.log("redirectTo 值：", redirectTo);

  try {
    if (!isDevShowLoginOtp()) {
      const supabase = await createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          redirectTo,
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      return {
        success: `登录链接已发送，请查收理大邮箱。${OTP_SPAM_HINT}`,
        devInfo: null,
      };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error) {
      throw error;
    }

    const otp = data.properties?.email_otp?.trim() ?? "";
    if (!otp) {
      throw new Error("开发调试：未能从 generateLink 取得 OTP");
    }

    const magicLink = `${redirectTo}?email=${encodeURIComponent(email)}&token=${encodeURIComponent(otp)}`;

    return {
      success: "【开发调试】已生成登录验证码，无需查收邮箱。",
      devInfo: { email, otp, magicLink },
    };
  } catch (err) {
    console.error("====SUPABASE ERROR====", err);
    const message =
      err instanceof Error ? err.message : "发送登录链接失败，请稍后重试";
    return {
      error: mapAuthErrorMessage(message),
      fieldErrors: message.toLowerCase().includes("email")
        ? { email: mapAuthErrorMessage(message) }
        : undefined,
      devInfo: null,
    };
  }
}

// ---------- 注册 ----------

export async function startRegisterAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = registerEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查邮箱地址",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const allowed = await canStartRegistrationWithEmail(email);
    if (!allowed) {
      return {
        fieldErrors: {
          email: "仅支持理大学生邮箱（@connect.polyu.hk）",
        },
        error: "请检查邮箱地址",
      };
    }

    const existingId = await findAuthUserIdByEmail(email);
    if (existingId) {
      const whitelisted = await isActiveWhitelistEmail(email);
      return {
        error: whitelisted
          ? "该邮箱已注册。白名单账号请使用「密码登录」，或通过「忘记密码」重置密码。"
          : "该邮箱已注册，请直接登录",
        step: "already_registered",
      };
    }

    const draft = await getOrCreateRegistrationDraft(email);
    await setRegistrationDraftCookie(draft.id);

    // 白名单：跳过验证码，直接进入设密码
    if (!isAllowedPolyuEmail(email) && (await isActiveWhitelistEmail(email))) {
      const admin = createAdminClient();
      await admin
        .from("registration_drafts")
        .update({
          email_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + REGISTRATION_DRAFT_TTL_MS,
          ).toISOString(),
        })
        .eq("id", draft.id);

      return {
        success: "邮箱已确认，请设置密码",
        step: "password",
        whitelisted: true,
      };
    }

    return issueOtpAndMaybeEmail(email, "register");
  } catch (error) {
    console.error(error);
    return {
      error: error instanceof Error ? error.message : "发送验证码失败",
    };
  }
}

/** 验证码步骤返回修改邮箱：清除注册草稿 cookie */
export async function backToRegisterEmailAction(
  _prevState: AuthFormState,
  _formData?: FormData,
): Promise<AuthFormState> {
  await clearRegistrationDraftCookie();
  return { step: "email", success: "请重新输入邮箱" };
}

export async function verifyRegisterOtpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const draft = await getRegistrationDraftByCookie();
  if (!draft) {
    return { error: "注册会话已过期，请重新开始", step: "email" };
  }

  const parsed = otpCodeSchema.safeParse({
    email: draft.email,
    otp: formData.get("otp"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查验证码",
      step: "otp",
    };
  }

  const result = await verifyOtpChallenge(
    draft.email,
    "register",
    parsed.data.otp,
  );
  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: { otp: result.error },
      step: "otp",
    };
  }

  const admin = createAdminClient();
  await admin
    .from("registration_drafts")
    .update({
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(
        Date.now() + REGISTRATION_DRAFT_TTL_MS,
      ).toISOString(),
    })
    .eq("id", draft.id);

  return { success: "邮箱验证成功，请设置密码", step: "password" };
}

export async function setRegisterPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const draft = await getRegistrationDraftByCookie();
  if (!draft?.email_verified_at) {
    return { error: "请先完成邮箱验证", step: "email" };
  }

  const parsed = setPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查密码",
      step: "password",
    };
  }

  const admin = createAdminClient();
  await admin
    .from("registration_drafts")
    .update({
      password_encrypted: encryptPasswordForDraft(parsed.data.password),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draft.id);

  return { success: "密码已保存，请完善资料", step: "profile" };
}

export async function completeRegisterAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const draft = await getRegistrationDraftByCookie();
  if (!draft?.email_verified_at || !draft.password_encrypted) {
    return { error: "注册会话不完整，请重新开始", step: "email" };
  }

  const existingId = await findAuthUserIdByEmail(draft.email);
  if (existingId) {
    await clearRegistrationDraftCookie();
    return { error: "该邮箱已注册，请直接登录", step: "already_registered" };
  }

  const parsed = firstSetupSchema.safeParse({
    grade: formData.get("grade"),
    major: formData.get("major"),
    nickname: formData.get("nickname") || "",
    avatarUrl: formData.get("avatarUrl") || "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查资料填写",
      step: "profile",
    };
  }

  const nickname = parsed.data.nickname?.trim() || "";
  let avatarUrl = parsed.data.avatarUrl?.trim() || "";
  const avatarFile = formData.get("avatar");
  const hasAvatarFile = avatarFile instanceof File && avatarFile.size > 0;

  if (nickname) {
    const available = await isNicknameAvailable(nickname);
    if (!available) {
      return {
        error: "该昵称已被占用",
        fieldErrors: { nickname: "该昵称已被占用" },
        step: "profile",
      };
    }
  }

  let password: string;
  try {
    password = decryptPasswordFromDraft(draft.password_encrypted);
  } catch {
    return { error: "注册会话已失效，请重新开始", step: "email" };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: draft.email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    return {
      error: mapAuthErrorMessage(
        createError?.message ?? "创建账号失败，请稍后重试",
      ),
      step: "profile",
    };
  }

  const userId = created.user.id;

  if (hasAvatarFile && avatarFile instanceof File) {
    const { uploadAvatarFromFormData } = await import(
      "@/lib/profile/uploadAvatar"
    );
    const upload = await uploadAvatarFromFormData(userId, avatarFile, {
      useServiceRole: true,
    });
    if (!upload.ok) {
      return { error: upload.error, step: "profile" };
    }
    avatarUrl = upload.publicUrl;
  }

  try {
    const { decideProfileSubmissionRisk } = await import(
      "@/lib/profile/profileRiskDecision"
    );
    const decision = decideProfileSubmissionRisk({
      nickname,
      avatarUrl,
    });

    const profileUpdate = {
      grade: parsed.data.grade,
      major: parsed.data.major.trim(),
      nickname: nickname || null,
      avatar_url: avatarUrl || null,
      display_name: decision.autoApprove ? nickname || null : null,
      approved_nickname: decision.autoApprove ? nickname || null : null,
      approved_avatar_url: decision.autoApprove ? avatarUrl || null : null,
      profile_review_status: decision.reviewStatus,
      review_reason: null as string | null,
      profile_risk_level: decision.level,
      profile_risk_flags: decision.flags,
      profile_risk_attention: decision.needsAttention,
      is_first_setup_completed: true,
      onboarding_completed: true,
    };

    const { error: profileError } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      return {
        error: profileError.message.includes("unique")
          ? "该昵称已被占用"
          : profileError.message,
        step: "profile",
      };
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: draft.email,
      password,
    });

    if (signInError) {
      await admin.auth.admin.deleteUser(userId);
      return {
        error: mapAuthErrorMessage(signInError.message),
        step: "profile",
      };
    }

    await admin.from("registration_drafts").delete().eq("id", draft.id);
    await clearRegistrationDraftCookie();

    // 白名单名额作废但保留记录
    await consumeWhitelistEmail({ email: draft.email, userId });

    revalidatePath("/", "layout");
    redirect(ROUTES.home);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // ignore cleanup failure
    }

    return {
      error: error instanceof Error ? error.message : "注册失败，请稍后重试",
      step: "profile",
    };
  }
}

// ---------- 登录 ----------

export async function loginWithPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = loginPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查登录信息",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: mapAuthErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}

export async function sendLoginOtpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = registerEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查邮箱地址",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existingId = await findAuthUserIdByEmail(email);
  if (!existingId) {
    return { error: "该邮箱尚未注册，请先注册" };
  }

  if (!isAllowedPolyuEmail(email) && !(await isActiveWhitelistEmail(email))) {
    return {
      fieldErrors: {
        email: "仅支持理大学生邮箱（@connect.polyu.hk）",
      },
      error: "请检查邮箱地址",
    };
  }

  return issueOtpAndMaybeEmail(email, "login");
}

export async function verifyLoginOtpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = otpCodeSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查验证码",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const result = await verifyOtpChallenge(email, "login", parsed.data.otp);
  if (!result.ok) {
    return { error: result.error, fieldErrors: { otp: result.error } };
  }

  const userId = await findAuthUserIdByEmail(email);
  if (!userId) {
    return { error: "该邮箱尚未注册，请先注册" };
  }

  // 通过临时 magic link 建 session（不依赖用户密码）
  const admin = createAdminClient();
  const redirectTo = getRedirectTo();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error || !data.properties?.hashed_token) {
    // 退化为 email_otp verify
    const otp = data?.properties?.email_otp;
    if (!otp) {
      return { error: mapAuthErrorMessage(error?.message ?? "登录失败") };
    }
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "magiclink",
    });
    if (verifyError) {
      return { error: mapAuthErrorMessage(verifyError.message) };
    }
  } else {
    const supabase = await createClient();
    const tokenHash = data.properties.hashed_token;
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (verifyError) {
      const otp = data.properties.email_otp;
      if (otp) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "magiclink",
        });
        if (otpError) {
          return { error: mapAuthErrorMessage(otpError.message) };
        }
      } else {
        return { error: mapAuthErrorMessage(verifyError.message) };
      }
    }
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}

// ---------- 忘记密码 ----------

export async function sendResetOtpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = registerEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查邮箱地址",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existingId = await findAuthUserIdByEmail(email);
  if (!existingId) {
    return { error: "该邮箱尚未注册" };
  }

  // 仅发 OTP；验证通过前不写入可改密 cookie，防止绕过验证码接管账号
  await clearResetVerifiedCookie();
  return issueOtpAndMaybeEmail(email, "reset_password");
}

export async function verifyResetOtpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) {
    return { error: "请先获取验证码", step: "email" };
  }

  const parsed = otpCodeSchema.safeParse({
    email,
    otp: formData.get("otp"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查验证码",
      step: "otp",
    };
  }

  const result = await verifyOtpChallenge(
    email,
    "reset_password",
    parsed.data.otp,
  );
  if (!result.ok) {
    return {
      error: result.error,
      fieldErrors: { otp: result.error },
      step: "otp",
    };
  }

  await setResetVerifiedCookie(email);
  return { success: "验证成功，请设置新密码", step: "password" };
}

export async function setNewPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const email = await getResetVerifiedEmail();
  if (!email) {
    return { error: "请先完成邮箱验证码校验", step: "email" };
  }

  const parsed = setPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: collectFieldErrors(parsed.error.issues),
      error: "请检查密码",
      step: "password",
    };
  }

  const userId = await findAuthUserIdByEmail(email);
  if (!userId) {
    return { error: "该邮箱尚未注册", step: "email" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: parsed.data.password,
  });
  if (error) {
    return { error: mapAuthErrorMessage(error.message), step: "password" };
  }

  await clearResetVerifiedCookie();

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });
  if (signInError) {
    return {
      success: "密码已更新，请使用新密码登录",
      step: "done",
    };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}

export async function logoutAction(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "认证服务未配置" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: mapAuthErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}

export async function logoutFormAction(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}
