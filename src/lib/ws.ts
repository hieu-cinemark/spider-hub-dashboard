import { currentAuthKey } from "./auth";
import { API_BASE_URL } from "./constants";

// Derives the WebSocket origin from the same NEXT_PUBLIC_API_BASE_URL the
// REST client uses (http -> ws, https -> wss) so there's only one place
// that knows where cinemark-api lives.
export function wsUrl(path: string): string {
  const base = new URL(API_BASE_URL);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  // Browsers can't set headers on a WebSocket handshake - the API also
  // accepts the key as ?api_key= (see cinemark-api/app/core/auth.py).
  const sep = path.includes("?") ? "&" : "?";
  return `${protocol}//${base.host}${path}${sep}api_key=${encodeURIComponent(currentAuthKey())}`;
}
