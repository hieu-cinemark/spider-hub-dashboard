"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook.
 *
 * `useSyncExternalStore` with a `false` server snapshot means the very first
 * (server-rendered and hydrated) markup is always the desktop layout, and the
 * mobile layout swaps in on the first client tick if the viewport is narrow.
 * That is the same "flash the table, then switch" behaviour antd's
 * `Grid.useBreakpoint` gave us before, but without pulling antd's Grid
 * context into every component that needs a breakpoint.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      // Safari < 14 only has the deprecated addListener/removeListener pair.
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
      }
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True below antd's `md` breakpoint (768px) - the phone/tablet range. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
