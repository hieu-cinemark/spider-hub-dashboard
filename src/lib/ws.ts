import { API_BASE_URL } from "./api";

// Derives the WebSocket origin from the same NEXT_PUBLIC_API_BASE_URL the
// REST client uses (http -> ws, https -> wss) so there's only one place
// that knows where cinemark-api lives.
export function wsUrl(path: string): string {
  const base = new URL(API_BASE_URL);
  const protocol = base.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${base.host}${path}`;
}
