/** 允许登录的 PolyU 学生邮箱后缀 */
export const POLYU_EMAIL_SUFFIX = "@connect.polyu.hk";

export const ALLOWED_EMAIL_SUFFIXES = [POLYU_EMAIL_SUFFIX] as const;

export function isAllowedPolyuEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return ALLOWED_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

/** 为 true 时登录页展示 Magic Link 入口（代码保留，默认关闭） */
export function isMagicLinkEnabled(): boolean {
  return process.env.AUTH_ENABLE_MAGIC_LINK === "true";
}

export const OTP_LENGTH = 6;
/** 验证码有效期：10 分钟（缩短爆破窗口） */
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const PASSWORD_MIN_LENGTH = 8;

export const WEAK_PASSWORDS = new Set(
  [
    "password",
    "password1",
    "password12",
    "password123",
    "12345678",
    "123456789",
    "1234567890",
    "qwertyui",
    "qwerty123",
    "abcdefg1",
    "abcdefgh",
    "polyu123",
    "polyuhub",
    "connect1",
    "11111111",
    "00000000",
    "88888888",
  ].map((item) => item.toLowerCase()),
);

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 30;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const AVATAR_BUCKET = "avatars";

export const DEFAULT_DISPLAY_NAME = "PolyU 同学";
export const DEFAULT_AVATAR_URL = "/avatars/default.svg";

export const REGISTRATION_DRAFT_COOKIE = "polyuhub_reg_draft";
export const REGISTRATION_DRAFT_TTL_MS = 2 * 60 * 60 * 1000;
export const RESET_PASSWORD_COOKIE = "polyuhub_reset_email";

export const OTP_SPAM_HINT =
  "验证码已发至你的理大邮箱（@connect.polyu.hk），若未收到请检查垃圾邮件文件夹。";
