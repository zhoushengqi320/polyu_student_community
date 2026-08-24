import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function isBlockedEitherWay(
  userA: string,
  userB: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`,
    )
    .limit(1);

  if (error) {
    return false;
  }
  return (data ?? []).length > 0;
}

export async function isBlockedBy(
  viewerId: string,
  otherUserId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_blocks")
    .select("blocker_id")
    .eq("blocker_id", otherUserId)
    .eq("blocked_id", viewerId)
    .maybeSingle();

  if (error) {
    return false;
  }
  return Boolean(data);
}

export async function hasBlockedUser(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_blocks")
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();

  if (error) {
    return false;
  }
  return Boolean(data);
}

export async function blockUserForMessages(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }
  if (blockerId === blockedId) {
    throw new DbError("不能屏蔽自己", "VALIDATION");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("message_blocks").upsert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    throw new DbError(error.message);
  }
}

export async function unblockUserForMessages(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("message_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  if (error) {
    throw new DbError(error.message);
  }
}
