import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { needsOnboarding } from "@/lib/auth/onboarding";
import { getProfileById } from "@/lib/db/profiles";
import { ROUTES } from "@/constants/routes";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.home;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await getProfileById(user.id);
        const destination = needsOnboarding(profile)
          ? ROUTES.onboarding
          : next;
        return NextResponse.redirect(`${origin}${destination}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}${ROUTES.login}?error=auth_callback_failed`,
  );
}
