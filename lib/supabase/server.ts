import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type Database } from "@/types/database";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

// Database Insert/Update 类型尚未完整生成，暂时放宽服务端返回类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<any> {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "未配置数据库环境变量，请在 .env.local 填入真实的 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
    );
  }

  const cookieStore = await cookies();
  const { url, anonKey } = config;

  return createServerClient<Database, "public">(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component 中可能无法写入 cookie，由 middleware 处理
        }
      },
    },
  });
}
