import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDevShowLoginOtp } from "@/lib/auth/devLoginOtp";
import { needsOnboarding } from "@/lib/auth/onboarding";
import { getProfileById } from "@/lib/db/profiles";
import { ROUTES } from "@/constants/routes";

/** 仅允许站内相对路径，防止开放重定向 */
function sanitizeNextPath(next: string | null): string {
  const fallback = ROUTES.home;
  if (!next) {
    return fallback;
  }
  const value = next.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }
  if (value.includes("\\") || value.includes("\0") || value.length > 200) {
    return fallback;
  }
  return value.split(/[?#]/, 1)[0] || fallback;
}

async function redirectAfterLogin(origin: string, next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await getProfileById(user.id);
    const destination = needsOnboarding(profile) ? ROUTES.onboarding : next;
    return NextResponse.redirect(`${origin}${destination}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";

  // 开发调试：?email=&token= 走 OTP 校验（仅非生产 + DEV_SHOW_LOGIN_OTP=true）
  if (email && token && isDevShowLoginOtp()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "magiclink",
    });

    if (!error) {
      return redirectAfterLogin(origin, next);
    }

    console.error("====SUPABASE OTP CALLBACK ERROR====", error);
    return NextResponse.redirect(
      `${origin}${ROUTES.login}?error=auth_callback_failed`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectAfterLogin(origin, next);
    }
  }

  return NextResponse.redirect(
    `${origin}${ROUTES.login}?error=auth_callback_failed`,
  );
}
