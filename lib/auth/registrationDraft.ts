import { cookies } from "next/headers";
import {
  REGISTRATION_DRAFT_COOKIE,
  REGISTRATION_DRAFT_TTL_MS,
  RESET_PASSWORD_COOKIE,
} from "@/constants/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setRegistrationDraftCookie(draftId: string) {
  const jar = await cookies();
  jar.set(REGISTRATION_DRAFT_COOKIE, draftId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(REGISTRATION_DRAFT_TTL_MS / 1000),
  });
}

export async function clearRegistrationDraftCookie() {
  const jar = await cookies();
  jar.delete(REGISTRATION_DRAFT_COOKIE);
}

export async function getRegistrationDraftId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REGISTRATION_DRAFT_COOKIE)?.value ?? null;
}

export async function setResetEmailCookie(email: string) {
  const jar = await cookies();
  jar.set(RESET_PASSWORD_COOKIE, email.trim().toLowerCase(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function getResetEmailCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(RESET_PASSWORD_COOKIE)?.value ?? null;
}

export async function clearResetEmailCookie() {
  const jar = await cookies();
  jar.delete(RESET_PASSWORD_COOKIE);
}

export async function getOrCreateRegistrationDraft(email: string) {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();
  const expiresAt = new Date(
    Date.now() + REGISTRATION_DRAFT_TTL_MS,
  ).toISOString();

  const { data: existing } = await admin
    .from("registration_drafts")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from("registration_drafts")
      .update({
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(error?.message ?? "更新注册草稿失败");
    }
    return data;
  }

  const { data, error } = await admin
    .from("registration_drafts")
    .insert({
      email: normalized,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "创建注册草稿失败");
  }

  return data;
}

export async function getRegistrationDraftByCookie() {
  const draftId = await getRegistrationDraftId();
  if (!draftId) {
    return null;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("registration_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  if (new Date(data.expires_at) <= new Date()) {
    await admin.from("registration_drafts").delete().eq("id", draftId);
    await clearRegistrationDraftCookie();
    return null;
  }

  return data;
}

export async function findAuthUserIdByEmail(
  email: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  // listUsers 分页查找（邮箱量级小时可接受）
  let page = 1;
  const perPage = 200;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(error.message);
    }

    const found = data.users.find(
      (user: { id: string; email?: string | null }) =>
        user.email?.toLowerCase() === normalized,
    );
    if (found) {
      return found.id;
    }

    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return null;
}
