import { createBrowserClient } from "@supabase/ssr";
import { type Database } from "@/types/database";

export function createClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "未配置数据库环境变量，请复制 .env.example 为 .env.local 并填入连接信息。",
    );
  }

  return createBrowserClient<Database, "public">(url, anonKey);
}
