"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { REFRESH_WATCH_TIMEOUT_MS } from "@/lib/constants";
import type { RefreshSocketMessage, RefreshStatus } from "@/lib/types";
import { wsUrl } from "@/lib/ws";

export interface RefreshTokenStreamState {
  status: RefreshStatus;
  startedAt: string | null;
  finishedAt: string | null;
  connected: boolean;
}

function subscribeVisibility(onStoreChange: () => void): () => void {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function getPageVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

const INITIAL: RefreshTokenStreamState = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  connected: false,
};

// Connects to cinemark-api's per-platform refresh-token WS and keeps this
// component's view of it in sync. The first message on every connection is
// a "snapshot" of whatever cinemark-api currently knows (see
// refresh_tracker.py) - which is what makes a page reload safe: mounting
// this hook fresh (a real reload, or just navigating back to this tab)
// reconnects and immediately re-hydrates from that snapshot instead of
// starting from a blank "idle" state, even if a refresh was already
// mid-flight before the reload.
// `enabled` (default true, so Facebook/Threads are unaffected) lets a
// caller skip opening the socket entirely - for a platform with no
// refresh-token WS at all this hook must still be called unconditionally
// (rules of hooks), but connecting would just retry a 404 forever.
// TikTok uses the same WS for identity/cookie refresh progress.
export function useRefreshTokenStream(platform: string, enabled: boolean = true) {
  const [state, setState] = useState<RefreshTokenStreamState>(INITIAL);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pageVisible = useSyncExternalStore(subscribeVisibility, getPageVisible, () => true);

  useEffect(() => {
    if (!enabled || !pageVisible) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let ws: WebSocket | undefined;

    function armClientTimeout() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setState((s) => (s.status === "running" ? { ...s, status: "failed" } : s));
      }, REFRESH_WATCH_TIMEOUT_MS);
    }

    function connect() {
      if (cancelled) return;
      ws = new WebSocket(wsUrl(`/${platform}/refresh-token/ws`));

      ws.onopen = () => setState((s) => ({ ...s, connected: true }));

      ws.onmessage = (event) => {
        // "line" messages (the per-line live tail - see cinemark-api's
        // refresh_tracker.py) are intentionally ignored here: this hook
        // used to accumulate every one into state, which meant a full
        // re-render (and, in RefreshLogPanel, a full re-parse of every line
        // seen so far) on each one - dozens per second during a busy
        // refresh, which is what was making the dashboard heavy. Only
        // status is shown now, so only "snapshot"/"status" are handled.
        const msg = JSON.parse(event.data) as RefreshSocketMessage;
        if (msg.type === "snapshot") {
          setState((prev) => {
            // Reconnect must not clobber a live run with an idle snapshot
            // from a different API worker, or reset success back to empty.
            if (prev.status === "running" && msg.status === "idle") {
              return { ...prev, connected: true };
            }
            if (prev.status === "success" && msg.status !== "success") {
              return { ...prev, connected: true };
            }
            return {
              status: msg.status,
              startedAt: msg.started_at,
              finishedAt: msg.finished_at,
              connected: true,
            };
          });
          if (msg.status === "running") armClientTimeout();
        } else if (msg.type === "status") {
          clearTimeout(timeoutRef.current);
          setState((s) => ({ ...s, status: msg.status, finishedAt: msg.finished_at ?? s.finishedAt }));
        }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (!cancelled && document.visibilityState === "visible") {
          retryTimer = setTimeout(connect, 5000);
        }
      };
      ws.onerror = () => ws?.close();
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearTimeout(timeoutRef.current);
      ws?.close();
    };
  }, [platform, enabled, pageVisible]);

  return state;
}
