export const ONBOARDING_LEGACY_KEY = "orbis_onboarding_complete";

export function onboardingCompleteKey(userId: string): string {
  return `orbis_onboarding_complete:${userId}`;
}

export function readOnboardingComplete(userId: string | null | undefined): boolean {
  if (!userId) return false;
  try {
    if (localStorage.getItem(onboardingCompleteKey(userId)) === "true") return true;
    // Legacy global key: treat as completed so existing browsers are not re-onboarded
    return localStorage.getItem(ONBOARDING_LEGACY_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeOnboardingComplete(userId: string | null | undefined): void {
  if (!userId) return;
  try {
    localStorage.setItem(onboardingCompleteKey(userId), "true");
  } catch {
    // Storage unavailable — do not block activation
  }
}
