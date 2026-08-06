import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/auth/getSiteUrl";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "polyuhub",
    supabaseConfigured: isSupabaseConfigured(),
    siteUrl: getSiteUrl(),
    timestamp: new Date().toISOString(),
  });
}
