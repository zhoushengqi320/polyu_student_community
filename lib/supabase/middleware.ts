import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { type Database } from "@/types/database";
import { shouldBypassOnboardingRedirect } from "@/lib/auth/onboarding";
import { ROUTES } from "@/constants/routes";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const config = getSupabasePublicConfig();
  if (!config) {
    return supabaseResponse;
  }

  const { url, anonKey } = config;

  const supabase = createServerClient<Database, "public">(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: CookieOptions;
        }>,
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  // Database Insert/Update 类型尚未完整生成
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (
    user &&
    !shouldBypassOnboardingRedirect(pathname)
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, is_first_setup_completed, role, status")
      .eq("id", user.id)
      .maybeSingle();

    const isAdminUser =
      profile?.role === "admin" && profile?.status === "active";

    const setupDone =
      profile?.is_first_setup_completed === true ||
      profile?.onboarding_completed === true;

    if (profile && !setupDone && !isAdminUser) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ROUTES.onboarding;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
