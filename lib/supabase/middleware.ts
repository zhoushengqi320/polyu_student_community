import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { type Database } from "@/types/database";
import { shouldBypassOnboardingRedirect } from "@/lib/auth/onboarding";
import { ROUTES } from "@/constants/routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

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
      .select("onboarding_completed, role, status")
      .eq("id", user.id)
      .maybeSingle();

    const isAdminUser =
      profile?.role === "admin" && profile?.status === "active";

    if (
      profile &&
      profile.onboarding_completed === false &&
      !isAdminUser
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = ROUTES.onboarding;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
