/** 允许登录的 PolyU 学生邮箱后缀 */
export const POLYU_EMAIL_SUFFIX = "@connect.polyu.hk";

export const ALLOWED_EMAIL_SUFFIXES = [POLYU_EMAIL_SUFFIX] as const;

export function isAllowedPolyuEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return ALLOWED_EMAIL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}
