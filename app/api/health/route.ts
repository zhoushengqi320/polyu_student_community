import { NextResponse } from "next/server";
import { getAppUrl, getAuthCallbackUrl } from "@/lib/auth/getSiteUrl";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "polyuhub",
    supabaseConfigured: isSupabaseConfigured(),
    appUrl: getAppUrl(),
    authCallbackUrl: getAuthCallbackUrl(),
    timestamp: new Date().toISOString(),
  });
}
