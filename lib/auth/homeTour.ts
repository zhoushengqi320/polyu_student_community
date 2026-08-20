import { type Profile } from "@/types/user";

export function shouldShowHomeTour(profile: Profile | null | undefined): boolean {
  return Boolean(
    profile &&
      (profile.isFirstSetupCompleted || profile.onboardingCompleted) &&
      !profile.homeTourCompletedAt,
  );
}
