import { cookies } from "next/headers";

export const VISITOR_COOKIE_NAME = "polyuhub_vid";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 days

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidVisitorId(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function createVisitorId(): string {
  return crypto.randomUUID();
}

export function getVisitorCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: "/",
  };
}

/** 读取访客匿名 ID（由 middleware 确保 cookie 存在） */
export async function getVisitorId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  return isValidVisitorId(value) ? value : null;
}
