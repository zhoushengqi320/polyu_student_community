import { createHash, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from "@/constants/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type OtpPurpose = "register" | "login" | "reset_password" | "change_password";

function getOtpPepper(): string {
  return (
    process.env.OTP_PEPPER ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "polyuhub-dev-otp-pepper"
  );
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const num = randomBytes(4).readUInt32BE(0) % max;
  return String(num).padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(code: string, email: string, purpose: OtpPurpose): string {
  return createHash("sha256")
    .update(`${getOtpPepper()}:${purpose}:${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

function getDraftEncryptionKey(): Buffer {
  const secret =
    process.env.REGISTRATION_DRAFT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "polyuhub-dev-draft-secret-key!!";
  return createHash("sha256").update(secret).digest();
}

export function encryptPasswordForDraft(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getDraftEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPasswordFromDraft(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("无效的草稿密码数据");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getDraftEncryptionKey(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export type CreateOtpResult =
  | {
      ok: true;
      code: string;
      challengeId: string;
      expiresAt: string;
      resendAvailableAt: string;
    }
  | { ok: false; error: string; resendAvailableAt?: string };

export async function createOtpChallenge(
  email: string,
  purpose: OtpPurpose,
): Promise<CreateOtpResult> {
  const normalized = email.trim().toLowerCase();
  const admin = createAdminClient();
  const now = new Date();

  const { data: existing } = await admin
    .from("otp_challenges")
    .select("id, resend_available_at, consumed_at, expires_at")
    .eq("email", normalized)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.resend_available_at) {
    const availableAt = new Date(existing.resend_available_at);
    if (availableAt > now && new Date(existing.expires_at) > now) {
      return {
        ok: false,
        error: "发送过于频繁，请稍后再试",
        resendAvailableAt: existing.resend_available_at,
      };
    }
  }

  // 作废同邮箱同用途的未消费验证码
  await admin
    .from("otp_challenges")
    .update({ consumed_at: now.toISOString() })
    .eq("email", normalized)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const code = generateOtpCode();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString();
  const resendAvailableAt = new Date(
    now.getTime() + OTP_RESEND_COOLDOWN_MS,
  ).toISOString();

  const { data, error } = await admin
    .from("otp_challenges")
    .insert({
      email: normalized,
      purpose,
      code_hash: hashOtpCode(code, normalized, purpose),
      expires_at: expiresAt,
      resend_available_at: resendAvailableAt,
      attempt_count: 0,
      max_attempts: OTP_MAX_ATTEMPTS,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "创建验证码失败" };
  }

  return {
    ok: true,
    code,
    challengeId: data.id,
    expiresAt,
    resendAvailableAt,
  };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; error: string; attemptsLeft?: number };

export async function verifyOtpChallenge(
  email: string,
  purpose: OtpPurpose,
  code: string,
): Promise<VerifyOtpResult> {
  const normalized = email.trim().toLowerCase();
  const trimmedCode = code.trim();
  const admin = createAdminClient();
  const now = new Date();

  const { data: challenge } = await admin
    .from("otp_challenges")
    .select("*")
    .eq("email", normalized)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challenge) {
    return { ok: false, error: "请先获取验证码" };
  }

  if (new Date(challenge.expires_at) <= now) {
    await admin
      .from("otp_challenges")
      .update({ consumed_at: now.toISOString() })
      .eq("id", challenge.id);
    return { ok: false, error: "验证码已过期，请重新获取" };
  }

  const expected = hashOtpCode(trimmedCode, normalized, purpose);
  if (expected !== challenge.code_hash) {
    const nextAttempts = (challenge.attempt_count ?? 0) + 1;
    const maxAttempts = challenge.max_attempts ?? OTP_MAX_ATTEMPTS;

    if (nextAttempts >= maxAttempts) {
      await admin
        .from("otp_challenges")
        .update({
          attempt_count: nextAttempts,
          consumed_at: now.toISOString(),
        })
        .eq("id", challenge.id);
      return {
        ok: false,
        error: "验证码输错次数过多，已失效，请重新获取",
        attemptsLeft: 0,
      };
    }

    await admin
      .from("otp_challenges")
      .update({ attempt_count: nextAttempts })
      .eq("id", challenge.id);

    return {
      ok: false,
      error: "验证码错误",
      attemptsLeft: maxAttempts - nextAttempts,
    };
  }

  await admin
    .from("otp_challenges")
    .update({ consumed_at: now.toISOString() })
    .eq("id", challenge.id);

  return { ok: true };
}
