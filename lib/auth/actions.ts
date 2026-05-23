"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginSchema, signupSchema } from "@/lib/validations/authSchema";
import {
  mapAuthErrorMessage,
  mapAuthFieldErrors,
} from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ROUTES } from "@/constants/routes";
import { type ActionResult } from "@/types/common";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string>>;
  success?: string;
};

function authUnavailableState(): AuthFormState {
  return {
    error: "认证服务未配置，请先设置环境变量。",
  };
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: mapAuthErrorMessage(error.message),
      fieldErrors: mapAuthFieldErrors(error.message),
    };
  }

  revalidatePath("/", "layout");
  redirect(ROUTES.home);
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) {
    return authUnavailableState();
  }

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "email" ||
        field === "password" ||
        field === "confirmPassword"
      ) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: mapAuthErrorMessage(error.message),
      fieldErrors: mapAuthFieldErrors(error.message),
    };
  }

  if (data.user && !data.session) {
    return {
      success: "注册成功，请查收验证邮件后再登录。",
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
