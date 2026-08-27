import { AUTH_STORAGE_KEY } from "./constants";

// Lightweight key-entry gate, not real auth: NEXT_PUBLIC_AUTH_KEY ships in
// the client bundle like any NEXT_PUBLIC_* var, and cinemark-api itself has
// no auth of its own (see its CORS_ORIGINS setup) - this only keeps the UI
// out of casual reach.
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

export function login(key: string): boolean {
  if (!REQUIRED_AUTH_KEY || key !== REQUIRED_AUTH_KEY) return false;
  window.localStorage.setItem(AUTH_STORAGE_KEY, key);
  notify();
  return true;
}

export function logout(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  notify();
}
