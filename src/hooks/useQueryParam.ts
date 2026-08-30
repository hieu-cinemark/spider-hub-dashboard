"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// A useState-shaped hook backed by one URL search param instead of
// component state - reloading, sharing a link, or hitting the browser's
// back button all preserve whichever tab/page was active, the way a
// dashboard like this is expected to behave. Uses router.replace (not
// push): a tab click or a page-change isn't a "new place" worth a
// separate back-button stop, it's the same view with a different filter.
// Setting back to `defaultValue` removes the param entirely, so the URL
// stays clean for the common case instead of always carrying e.g. "?tab=all".
export function useQueryParam(key: string, defaultValue: string): [string, (value: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, next);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [key, defaultValue, pathname, router, searchParams],
  );

  return [value, setValue];
}
