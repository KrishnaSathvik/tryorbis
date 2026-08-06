const PREFIX = "orbis_waitlist_joined:";

function keyFor(identity: string): string {
  return `${PREFIX}${identity}`;
}

/** Persist waitlist membership client-side (table is INSERT-only under RLS). */
export function readWaitlistJoined(identity: string | null | undefined): boolean {
  if (!identity) return false;
  try {
    return localStorage.getItem(keyFor(identity)) === "true";
  } catch {
    return false;
  }
}

export function writeWaitlistJoined(identity: string | null | undefined): void {
  if (!identity) return;
  try {
    localStorage.setItem(keyFor(identity), "true");
  } catch {
    // ignore quota / private mode
  }
}

export function clearWaitlistJoined(identity: string | null | undefined): void {
  if (!identity) return;
  try {
    localStorage.removeItem(keyFor(identity));
  } catch {
    // ignore
  }
}
