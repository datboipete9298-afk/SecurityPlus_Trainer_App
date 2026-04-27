import type { PersistedState } from "./storage";

const SESSION_SLOT_KEY = "spt_ext_identity_slot_v1";
const FLASH_LINE_KEY = "spt_flash_extension_identity";
const BUCKET_COOLDOWN_MS = 72 * 3600000;

export type OutsideIdentityBucket =
  | "lesson_complete"
  | "pbq_first"
  | "session30"
  | "flashcard_streak"
  | "weak_card_repair";

export function extensionIdentitySlotTaken(): boolean {
  try {
    return sessionStorage.getItem(SESSION_SLOT_KEY) === "1";
  } catch {
    return false;
  }
}

export function extensionIdentitySlotConsume(): void {
  try {
    sessionStorage.setItem(SESSION_SLOT_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** True if this bucket may be shown (session slot free + no recent repeat of same bucket). */
export function canOfferExtensionIdentity(s: PersistedState, bucket: OutsideIdentityBucket): boolean {
  if (extensionIdentitySlotTaken()) return false;
  const echo = s.outsideQuizIdentityEcho;
  if (echo?.bucket === bucket && Date.now() - echo.at < BUCKET_COOLDOWN_MS) return false;
  return true;
}

export function markExtensionIdentityEcho(s: PersistedState, bucket: OutsideIdentityBucket): PersistedState {
  return { ...s, outsideQuizIdentityEcho: { bucket, at: Date.now() } };
}

export function flashExtensionIdentityForDashboard(line: string): void {
  try {
    sessionStorage.setItem(FLASH_LINE_KEY, line);
  } catch {
    /* ignore */
  }
}

export function readAndClearFlashExtensionIdentity(): string | null {
  try {
    const v = sessionStorage.getItem(FLASH_LINE_KEY);
    if (v) sessionStorage.removeItem(FLASH_LINE_KEY);
    return v;
  } catch {
    return null;
  }
}
