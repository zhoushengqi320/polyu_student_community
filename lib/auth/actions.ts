"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { polyuEmailSchema } from "@/lib/validations/authSchema";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ROUTES } from "@/constants/routes";
import { type ActionResult } from "@/types/common";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email", string>>;
  success?: string;
};

function authUnavailableState(): AuthFormState {
  return {
    error: "认证服务未配置，请先设置环境变量。",
  };
}

function getAuthCallbackUrl(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`;
}

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
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "email") {
        fieldErrors.email = issue.message;
      }
    }
    return { fieldErrors, error: "请检查邮箱地址" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email.trim().toLowerCase(),
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      error: mapAuthErrorMessage(error.message),
      fieldErrors: error.message.toLowerCase().includes("email")
        ? { email: mapAuthErrorMessage(error.message) }
        : undefined,
    };
  }

  return {
    success: "登录链接已发送，请查收理大邮箱（含垃圾邮件文件夹）。",
  };
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
