import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isBlockedInternalPath(pathname: string) {
  const decoded = decodeURIComponent(pathname);

  return (
    decoded === "/content" ||
    decoded.startsWith("/content/") ||
    decoded === "/网站素材" ||
    decoded.startsWith("/网站素材/") ||
    decoded === "/resources" ||
    decoded.startsWith("/resources/")
  );
}

export async function middleware(request: NextRequest) {
  if (isBlockedInternalPath(request.nextUrl.pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
