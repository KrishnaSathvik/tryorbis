export const ONBOARDING_LEGACY_KEY = "orbis_onboarding_complete";

export function onboardingCompleteKey(userId: string): string {
  return `orbis_onboarding_complete:${userId}`;
}

function safeRemoveLegacy(): void {
  try {
    localStorage.removeItem(ONBOARDING_LEGACY_KEY);
  } catch {
    // Storage unavailable — ignore
  }
}

export function readOnboardingComplete(userId: string | null | undefined): boolean {
  if (!userId) return false;
  try {
    const scopedKey = onboardingCompleteKey(userId);
    if (localStorage.getItem(scopedKey) === "true") {
      // Clear leftover legacy so it cannot suppress onboarding for later accounts
      if (localStorage.getItem(ONBOARDING_LEGACY_KEY) === "true") {
        safeRemoveLegacy();
      }
      return true;
    }

    if (localStorage.getItem(ONBOARDING_LEGACY_KEY) === "true") {
      try {
        localStorage.setItem(scopedKey, "true");
        localStorage.removeItem(ONBOARDING_LEGACY_KEY);
      } catch {
        // Migration write/remove failed — still treat current session as complete
      }
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function writeOnboardingComplete(userId: string | null | undefined): void {
  if (!userId) return;
  try {
    localStorage.setItem(onboardingCompleteKey(userId), "true");
    safeRemoveLegacy();
  } catch {
    // Storage unavailable — do not block activation
  }
}
