import { createBrowserClient } from "@supabase/ssr";
import { type Database } from "@/types/database";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

// Database Insert/Update 类型尚未完整生成，暂时放宽客户端返回类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "未配置数据库环境变量，请在 .env.local 填入真实的 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
    );
  }

  return createBrowserClient<Database, "public">(config.url, config.anonKey);
}
