import { API_BASE_URL, AUTH_STORAGE_KEY } from "./constants";

// The typed key is checked against cinemark-api's own GET /auth/check and
// then sent on every request (X-API-Key). When the API has no key
// configured (API_AUTH_KEY unset, auth_required=false) this falls back to
// the old client-side gate against NEXT_PUBLIC_AUTH_KEY - which ships in the
// bundle, so it only keeps the UI out of casual reach. It is NOT a
// server-side secret and must never be treated as one.
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

// localStorage can throw (Safari private mode, disabled storage, quota
// errors) - reading it unguarded used to crash the whole app shell.
export function getAuthSnapshot(): string {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
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

// /auth/check has no timeout of its own on the client, so a hung API left
// the login screen spinning forever with no way to tell "wrong key" from
// "server unreachable". 10s is generous for a local metadata call and
// short enough to be worth retrying.
const AUTH_CHECK_TIMEOUT_MS = 10_000;

export type AuthCheckOutcome =
  /** The API confirmed the key is good. */
  | { kind: "accepted" }
  /** The API confirmed the key is wrong. */
  | { kind: "rejected" }
  /**
   * The API confirmed it does not require a key at all (auth_required=false),
   * so anonymous/local mode is legitimate. Only this - never a network
   * error - may unlock the dashboard.
   */
  | { kind: "not-required" }
  /** The API could not be reached / answered unusably. */
  | { kind: "unreachable"; detail: string };

async function checkAuth(key: string, signal?: AbortSignal): Promise<AuthCheckOutcome> {
  const timeoutSignal = AbortSignal.timeout(AUTH_CHECK_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/check`, {
      headers: { "X-API-Key": key },
      cache: "no-store",
      signal: combined,
    });
  } catch (err) {
    return {
      kind: "unreachable",
      detail: err instanceof DOMException && err.name === "TimeoutError" ? "timeout" : "network",
    };
  }
  if (!res.ok) {
    // 401/403 mean the key is simply wrong - that's a real answer, not a
    // connectivity problem, and the user should be told to retype it.
    if (res.status === 401 || res.status === 403) return { kind: "rejected" };
    return { kind: "unreachable", detail: `status ${res.status}` };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { kind: "unreachable", detail: "malformed" };
  }
  if (!body || typeof body !== "object") return { kind: "unreachable", detail: "malformed" };
  const parsed = body as { auth_required?: unknown; valid?: unknown };
  if (typeof parsed.auth_required !== "boolean" || typeof parsed.valid !== "boolean") {
    return { kind: "unreachable", detail: "malformed" };
  }
  if (!parsed.auth_required) return { kind: "not-required" };
  return parsed.valid ? { kind: "accepted" } : { kind: "rejected" };
}

export async function login(key: string): Promise<boolean> {
  const trimmed = key.trim();
  if (!trimmed) return false;
  const outcome = await checkAuth(trimmed);
  if (outcome.kind === "accepted" || outcome.kind === "not-required") {
    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, trimmed);
    } catch {
      return false;
    }
    notify();
    return true;
  }
  return false;
}

// Logout must also drop whatever was cached for the session that just
// ended. The QueryClient lives outside AuthGate (see app/providers.tsx), so
// nothing cleared it automatically - a second login in the same page
// lifetime could otherwise be served the previous session's cached
// credentials. Registered by providers.tsx, which owns the QueryClient.
let onSessionEnded: (() => void) | null = null;

export function registerSessionEndHandler(handler: (() => void) | null): void {
  onSessionEnded = handler;
}

export function logout(): void {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage unavailable - the in-memory session still has to end.
  }
  onSessionEnded?.();
  notify();
}
