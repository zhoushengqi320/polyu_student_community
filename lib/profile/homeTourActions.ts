"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  markHomeTourCompleted,
  resetHomeTourCompleted,
} from "@/lib/db/profiles";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function completeHomeTourAction(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置。" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录。" };
  }

  const result = await markHomeTourCompleted(user.id);
  if (result.error) {
    return result;
  }

  revalidatePath(ROUTES.home);
  return {};
}

export async function resetHomeTourFormAction(_formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const user = await getSessionUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  await resetHomeTourCompleted(user.id);
  revalidatePath(ROUTES.home);
  revalidatePath(ROUTES.profile(user.id));
  redirect(ROUTES.home);
}
