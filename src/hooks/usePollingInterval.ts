"use client";

import { useSyncExternalStore } from "react";

function subscribeVisibility(onStoreChange: () => void): () => void {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function getPageVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

/** Returns `intervalMs` while the tab is visible, otherwise `false` so React
 * Query stops background polling and the UI stays responsive. */
export function usePollingInterval(intervalMs: number, enabled = true): number | false {
  const visible = useSyncExternalStore(subscribeVisibility, getPageVisible, () => true);
  if (!enabled || !visible) return false;
  return intervalMs;
}
