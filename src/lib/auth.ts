import { API_BASE_URL, AUTH_STORAGE_KEY } from "./constants";

// The typed key is checked against cinemark-api's own GET /auth/check and
// then sent on every request (X-API-Key). When the API has no key
// configured (API_AUTH_KEY unset, auth_required=false) this falls back to
// the old client-side gate against NEXT_PUBLIC_AUTH_KEY - which ships in the
// bundle, so it only keeps the UI out of casual reach.
export const REQUIRED_AUTH_KEY = process.env.NEXT_PUBLIC_AUTH_KEY;

// Sentinel the server (and the very first client render, before hydration
// can safely touch localStorage) reports - distinct from "checked, found
// nothing" (empty string). Without this distinction, that first render has
// to guess, and guessing "logged out" is what caused the login screen to
// flash on every reload even for an already-authed session: the real
// localStorage value only became visible a tick later, after
// useSyncExternalStore's post-hydration resync. AuthGate treats this
// sentinel as "still checking", not "unauthorized".
export const AUTH_PENDING = "__auth_pending__";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeAuth(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getAuthSnapshot(): string {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) ?? "";
}

export function getAuthServerSnapshot(): string {
  return AUTH_PENDING;
}

// Forces AuthGate's useSyncExternalStore to re-read localStorage right
// away. React is supposed to do this on its own the instant hydration
// commits, but on a cold `next dev` start (the route's first-ever compile,
// slower than normal) that automatic recheck can lag behind - AuthGate was
// then stuck showing AUTH_PENDING's loading skeleton until something else
// (a manual reload) forced a re-render. Calling this once from AuthGate's
// own useEffect makes the resync unconditional instead of depending on
// that timing.
export function resyncAuth(): void {
  notify();
}

export function currentAuthKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

async function keyAccepted(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/check`, { headers: { "X-API-Key": key }, cache: "no-store" });
    const body: { auth_required: boolean; valid: boolean } = await res.json();
    if (body.auth_required) return body.valid;
  } catch {
    // API unreachable - fall through to the client-side check so the
    // dashboard still opens (and shows its own "could not reach API").
  }
  // Neither side configures a key: nothing to check against.
  if (!REQUIRED_AUTH_KEY) return true;
  return key === REQUIRED_AUTH_KEY;
}

export async function login(key: string): Promise<boolean> {
  if (!(await keyAccepted(key))) return false;
  window.localStorage.setItem(AUTH_STORAGE_KEY, key);
  notify();
  return true;
}

export function logout(): void {
  if (!window.localStorage.getItem(AUTH_STORAGE_KEY)) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notify();
}
