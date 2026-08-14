import { DbError } from "@/lib/db/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAllowedPolyuEmail } from "@/constants/auth";

export type EmailWhitelistRow = {
  id: string;
  email: string;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  consumedAt: string | null;
  consumedUserId: string | null;
};

function mapRow(row: Record<string, unknown>): EmailWhitelistRow {
  return {
    id: String(row.id),
    email: String(row.email),
    note: (row.note as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: String(row.created_at),
    consumedAt: (row.consumed_at as string | null) ?? null,
    consumedUserId: (row.consumed_user_id as string | null) ?? null,
  };
}

export function normalizeWhitelistEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 是否仍有可用（未消费）白名单名额 */
export async function isActiveWhitelistEmail(email: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const normalized = normalizeWhitelistEmail(email);
  if (!normalized || isAllowedPolyuEmail(normalized)) {
    return false;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_whitelist")
      .select("id")
      .eq("email", normalized)
      .is("consumed_at", null)
      .maybeSingle();

    if (error) {
      console.error("Failed to check email whitelist:", error);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.error("Failed to check email whitelist:", error);
    return false;
  }
}

/** 理大邮箱，或未消费白名单 */
export async function canStartRegistrationWithEmail(
  email: string,
): Promise<boolean> {
  const normalized = normalizeWhitelistEmail(email);
  if (isAllowedPolyuEmail(normalized)) {
    return true;
  }
  return isActiveWhitelistEmail(normalized);
}

export async function listEmailWhitelist(
  limit = 100,
): Promise<EmailWhitelistRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_whitelist")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("Failed to list email whitelist:", error);
      return [];
    }

    return (data as Array<Record<string, unknown>>).map(mapRow);
  } catch (error) {
    console.error("Failed to list email whitelist:", error);
    return [];
  }
}

export async function addEmailToWhitelist(input: {
  email: string;
  note?: string | null;
  createdBy: string;
}): Promise<EmailWhitelistRow> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const email = normalizeWhitelistEmail(input.email);
  if (!email.includes("@")) {
    throw new DbError("请输入有效邮箱", "VALIDATION");
  }

  if (isAllowedPolyuEmail(email)) {
    throw new DbError(
      "理大邮箱无需加入白名单，可直接注册",
      "VALIDATION",
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("email_whitelist")
    .insert({
      email,
      note: input.note?.trim() || null,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new DbError("该邮箱已在白名单中（含已使用记录）", "VALIDATION");
    }
    throw new DbError(error?.message ?? "添加白名单失败");
  }

  return mapRow(data as Record<string, unknown>);
}

/** 仅允许删除尚未使用的条目；已使用记录永久保留 */
export async function removeUnusedWhitelistEntry(
  id: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("email_whitelist")
    .select("id, consumed_at")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    throw new DbError(readError.message);
  }
  if (!existing) {
    throw new DbError("白名单记录不存在", "VALIDATION");
  }
  if (existing.consumed_at) {
    throw new DbError("已使用的白名单记录不可删除", "VALIDATION");
  }

  const { error } = await admin.from("email_whitelist").delete().eq("id", id);
  if (error) {
    throw new DbError(error.message);
  }
}

/** 注册成功后作废名额并保留记录 */
export async function consumeWhitelistEmail(input: {
  email: string;
  userId: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const email = normalizeWhitelistEmail(input.email);
  if (isAllowedPolyuEmail(email)) {
    return false;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_whitelist")
      .update({
        consumed_at: new Date().toISOString(),
        consumed_user_id: input.userId,
      })
      .eq("email", email)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to consume whitelist email:", error);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.error("Failed to consume whitelist email:", error);
    return false;
  }
}
