import { type Profile } from "@/types/user";

export function needsOnboarding(profile: Profile | null | undefined): boolean {
  return Boolean(profile && !profile.onboardingCompleted);
}

export function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/auth/");
}

export function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding";
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function shouldBypassOnboardingRedirect(pathname: string): boolean {
  return isAuthPath(pathname) || isOnboardingPath(pathname) || isAdminPath(pathname);
}
