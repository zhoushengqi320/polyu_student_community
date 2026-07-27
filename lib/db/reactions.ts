import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type TargetType } from "@/constants/reportReasons";

export type ReactionType = "like" | "favorite";

export async function toggleReaction(input: {
  userId: string;
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
}): Promise<"added" | "removed"> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      throw new DbError(error.message);
    }

    return "removed";
  }

  const { error } = await supabase.from("reactions").insert({
    user_id: input.userId,
    target_type: input.targetType,
    target_id: input.targetId,
    type: input.type,
  });

  if (error) {
    throw new DbError(error.message);
  }

  return "added";
}

export async function hasReaction(input: {
  userId: string;
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type)
    .maybeSingle();

  return Boolean(data);
}

export async function countReactions(input: {
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
}): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type);

  if (error) {
    console.error("Failed to count reactions:", error);
    return 0;
  }

  return count ?? 0;
}
