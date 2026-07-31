import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { type Database } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!key || key.toLowerCase().includes("your_supabase")) {
    return null;
  }
  return key;
}

/** 仅服务端使用：跳过 RLS，用于管理员图片上传等运维操作 */
// Database Insert/Update 类型尚未完整生成，暂时放宽返回类型（与 server.ts 一致）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient(): any {
  if (!isSupabaseConfigured()) {
    throw new Error("数据库未配置");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error("未配置 SUPABASE_SERVICE_ROLE_KEY，无法上传图片");
  }

  return createSupabaseClient<Database, "public">(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
