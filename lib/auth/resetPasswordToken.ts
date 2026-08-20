import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { RESET_PASSWORD_COOKIE } from "@/constants/auth";

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

function getResetSigningSecret(): string {
  const secret =
    process.env.OTP_PEPPER ||
    process.env.REGISTRATION_DRAFT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing secret for password reset token");
    }
    return "polyuhub-dev-reset-secret";
  }
  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getResetSigningSecret())
    .update(payload)
    .digest("base64url");
}

/** OTP 验证通过后写入：payload.sig（payload = base64url(email).exp） */
export function createResetVerifiedToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const exp = Date.now() + RESET_TOKEN_TTL_MS;
  const emailPart = Buffer.from(normalized, "utf8").toString("base64url");
  const payload = `${emailPart}.${exp}`;
  return `${payload}.${signPayload(payload)}`;
}

/** 解析并校验重置 token，成功返回邮箱 */
export function parseResetVerifiedToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) {
    return null;
  }
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  if (!payload || !sig) {
    return null;
  }

  const expected = signPayload(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }

  const sep = payload.lastIndexOf(".");
  if (sep <= 0) {
    return null;
  }
  const emailPart = payload.slice(0, sep);
  const exp = Number(payload.slice(sep + 1));
  if (!Number.isFinite(exp) || exp < Date.now()) {
    return null;
  }

  try {
    return Buffer.from(emailPart, "base64url").toString("utf8").trim().toLowerCase();
  } catch {
    return null;
  }
}

export async function setResetVerifiedCookie(email: string) {
  const jar = await cookies();
  jar.set(RESET_PASSWORD_COOKIE, createResetVerifiedToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(RESET_TOKEN_TTL_MS / 1000),
  });
}

export async function getResetVerifiedEmail(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(RESET_PASSWORD_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  return parseResetVerifiedToken(raw);
}

export async function clearResetVerifiedCookie() {
  const jar = await cookies();
  jar.delete(RESET_PASSWORD_COOKIE);
}
