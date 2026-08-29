export const GUEST_IDENTITY_KEY = "coversall_guest_identity";

export type StoredGuestIdentity = {
  name: string;
  email: string;
};

export function getStoredGuestIdentity(): StoredGuestIdentity | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(GUEST_IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredGuestIdentity;
    if (!parsed.name || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeGuestIdentity(identity: StoredGuestIdentity) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    // ignore storage failures
  }
}

export function clearGuestIdentity() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_IDENTITY_KEY);
  } catch {
    // ignore
  }
}
