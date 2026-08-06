/**
 * Temporary Landing → guest-auth idea handoff via sessionStorage.
 * Idea text never goes in URLs or analytics.
 */

export const LANDING_VALIDATE_PREFILL_KEY = "orbis_landing_validate_prefill";
export const LANDING_VALIDATE_PREFILL_TTL_MS = 30 * 60 * 1000;

export type LandingValidatePrefillRecord = {
  text: string;
  createdAt: number;
};

export class LandingPrefillWriteError extends Error {
  constructor() {
    super("LANDING_PREFILL_WRITE_FAILED");
    this.name = "LandingPrefillWriteError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function writeLandingValidatePrefill(rawText: string): void {
  const text = rawText.trim();
  if (!text) {
    throw new LandingPrefillWriteError();
  }
  const record: LandingValidatePrefillRecord = {
    text,
    createdAt: Date.now(),
  };
  try {
    sessionStorage.setItem(LANDING_VALIDATE_PREFILL_KEY, JSON.stringify(record));
  } catch {
    throw new LandingPrefillWriteError();
  }
}

export function clearLandingValidatePrefill(): void {
  try {
    sessionStorage.removeItem(LANDING_VALIDATE_PREFILL_KEY);
  } catch {
    // Storage unavailable — ignore
  }
}

export function readLandingValidatePrefill(
  now: number = Date.now(),
): LandingValidatePrefillRecord | null {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(LANDING_VALIDATE_PREFILL_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearLandingValidatePrefill();
    return null;
  }

  if (!isRecord(parsed)) {
    clearLandingValidatePrefill();
    return null;
  }

  const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  const createdAt =
    typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt)
      ? parsed.createdAt
      : NaN;

  if (!text || !Number.isFinite(createdAt)) {
    clearLandingValidatePrefill();
    return null;
  }

  if (now - createdAt > LANDING_VALIDATE_PREFILL_TTL_MS) {
    clearLandingValidatePrefill();
    return null;
  }

  return { text, createdAt };
}
