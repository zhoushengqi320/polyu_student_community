import { CONTENT_STATUS } from "@/constants/contentStatus";
import { REPORT_STATUS, TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const OPEN_REPORT_STATUSES = [
  REPORT_STATUS.pending,
  REPORT_STATUS.reviewing,
  REPORT_STATUS.reviewed,
] as const;

export async function countDistinctReporters(
  targetType: TargetType,
  targetId: string,
): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("reporter_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .in("status", [...OPEN_REPORT_STATUSES]);

  if (error || !data) {
    return 0;
  }

  return new Set(data.map((row: { reporter_id: string }) => row.reporter_id)).size;
}

export async function getContentOwnerId(
  targetType: TargetType,
  targetId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();

  if (targetType === TARGET_TYPES.post) {
    const { data } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data } = await supabase
      .from("course_reviews")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data } = await supabase
      .from("food_recommendations")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  return null;
}

export async function hideContentByTarget(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();

  if (targetType === TARGET_TYPES.post) {
    const { data, error } = await supabase
      .from("posts")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data, error } = await supabase
      .from("comments")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data, error } = await supabase
      .from("course_reviews")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data, error } = await supabase
      .from("food_places")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data, error } = await supabase
      .from("food_recommendations")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  throw new DbError("暂不支持隐藏该类型内容");
}

export async function restoreContentByTarget(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();

  if (targetType === TARGET_TYPES.post) {
    const { data, error } = await supabase
      .from("posts")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data, error } = await supabase
      .from("comments")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data, error } = await supabase
      .from("course_reviews")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data, error } = await supabase
      .from("food_places")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data, error } = await supabase
      .from("food_recommendations")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  return false;
}

export async function listOpenReporterIdsForTarget(
  targetType: TargetType,
  targetId: string,
): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("reporter_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .in("status", [...OPEN_REPORT_STATUSES]);

  if (error || !data) {
    return [];
  }

  return [
    ...new Set(
      (data as Array<{ reporter_id: string }>).map((row) => row.reporter_id),
    ),
  ];
}
