import { ROUTES } from "@/constants/routes";
import { needsOnboarding } from "@/lib/auth/onboarding";
import { type Profile } from "@/types/user";

/** 仅允许站内相对路径，防止开放重定向 */
export function sanitizeNextPath(next: string | null | undefined): string {
  const fallback = ROUTES.home;
  if (!next) {
    return fallback;
  }

  const value = next.trim();
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://")
  ) {
    return fallback;
  }

  if (value.includes("\\") || value.includes("\0") || value.length > 200) {
    return fallback;
  }

  return value.split(/[?#]/, 1)[0] || fallback;
}

export function resolvePostLoginPath(
  next: string | null | undefined,
  profile: Profile | null | undefined,
): string {
  if (needsOnboarding(profile)) {
    return ROUTES.onboarding;
  }

  return sanitizeNextPath(next);
}

export function readNextFromFormData(formData: FormData): string | null {
  const value = formData.get("next");
  return typeof value === "string" && value.trim() ? value : null;
}
