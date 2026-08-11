"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  completeFirstSetup,
  submitProfileForReview,
} from "@/lib/db/profiles";
import {
  firstSetupSchema,
  updateProfileReviewSchema,
} from "@/lib/validations/authSchema";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AVATAR_ALLOWED_MIME, AVATAR_BUCKET, AVATAR_MAX_BYTES } from "@/constants/auth";
import { createClient } from "@/lib/supabase/server";

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

  try {
    await completeFirstSetup(user.id, parsed.data);
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

  const parsed = updateProfileReviewSchema.safeParse({
    nickname: formData.get("nickname") || "",
    avatarUrl: formData.get("avatarUrl") || "",
    grade: formData.get("grade") || undefined,
    major: formData.get("major") || undefined,
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

  try {
    await submitProfileForReview(user.id, parsed.data);
    revalidatePath(ROUTES.profile(user.id));
    revalidatePath("/", "layout");
    return {
      success:
        parsed.data.nickname || parsed.data.avatarUrl
          ? "已提交，昵称/头像进入审核队列。审核通过前全站仍显示默认资料。"
          : "资料已更新",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "更新失败，请稍后重试";
    return { error: message };
  }
}

export async function uploadAvatarAction(
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

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "请选择头像文件" };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "头像不能超过 2MB" };
  }

  if (!AVATAR_ALLOWED_MIME.includes(file.type as (typeof AVATAR_ALLOWED_MIME)[number])) {
    return { error: "仅支持 JPG / PNG / WebP" };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  try {
    const nickname = String(formData.get("nickname") || "").trim();
    await submitProfileForReview(user.id, {
      nickname,
      avatarUrl: publicUrl,
      grade: String(formData.get("grade") || "") || undefined,
      major: String(formData.get("major") || "") || undefined,
    });
    revalidatePath(ROUTES.profile(user.id));
    return {
      success: "头像已上传并进入审核队列。",
      fieldErrors: { avatarUrl: publicUrl },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存头像失败",
    };
  }
}
