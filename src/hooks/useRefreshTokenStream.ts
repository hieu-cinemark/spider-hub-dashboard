"use client";

import { useEffect, useRef, useState } from "react";
import { REFRESH_WATCH_TIMEOUT_MS } from "@/lib/constants";
import type { RefreshSocketMessage, RefreshStatus } from "@/lib/types";
import { wsUrl } from "@/lib/ws";

export interface RefreshTokenStreamState {
  status: RefreshStatus;
  startedAt: string | null;
  finishedAt: string | null;
  lines: string[];
  connected: boolean;
}

const INITIAL: RefreshTokenStreamState = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  lines: [],
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
export function useRefreshTokenStream(platform: string) {
  const [state, setState] = useState<RefreshTokenStreamState>(INITIAL);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
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
        const msg = JSON.parse(event.data) as RefreshSocketMessage;
        if (msg.type === "snapshot") {
          setState({
            status: msg.status,
            startedAt: msg.started_at,
            finishedAt: msg.finished_at,
            lines: msg.lines,
            connected: true,
          });
          if (msg.status === "running") armClientTimeout();
        } else if (msg.type === "line") {
          setState((s) => ({ ...s, lines: [...s.lines, msg.line] }));
        } else if (msg.type === "status") {
          clearTimeout(timeoutRef.current);
          setState((s) => ({ ...s, status: msg.status, finishedAt: msg.finished_at ?? s.finishedAt }));
        }
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, connected: false }));
        if (!cancelled) retryTimer = setTimeout(connect, 3000);
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
  }, [platform]);

  return state;
}
