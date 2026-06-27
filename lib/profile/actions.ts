"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { completeOnboarding } from "@/lib/db/profiles";
import { onboardingSchema } from "@/lib/validations/authSchema";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type OnboardingFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"displayName" | "username" | "grade" | "major", string>
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

  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    grade: formData.get("grade"),
    major: formData.get("major"),
  });

  if (!parsed.success) {
    const fieldErrors: OnboardingFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "displayName" ||
        field === "username" ||
        field === "grade" ||
        field === "major"
      ) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  try {
    await completeOnboarding(user.id, parsed.data);
    revalidatePath("/", "layout");
    redirect(ROUTES.home);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "保存资料失败，请稍后重试";

    if (message.includes("用户名")) {
      return { fieldErrors: { username: message }, error: message };
    }

    return { error: message };
  }
}
