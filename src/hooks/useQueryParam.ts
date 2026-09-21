"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// URL-backed state. A tab click, platform filter, or page change writes
// the full snapshot of that screen's params (including defaults like
// tab=all / page=1) so a shared or reloaded link restores exactly what
// was on screen. router.replace (not push): filter changes aren't a new
// place on the back-button stack.

function replaceSearch(pathname: string, current: string, patch: Record<string, string | null>): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function useQueryParam(key: string, defaultValue: string): [string, (value: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      router.replace(replaceSearch(pathname, search, { [key]: next }), { scroll: false });
    },
    [key, pathname, router, search],
  );

  return [value, setValue];
}

export function useQueryRecord<T extends Record<string, string>>(
  defaults: T,
): [T, (patch: Partial<T>) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const value = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    value[key] = (searchParams.get(String(key)) as T[keyof T]) ?? defaults[key];
  }

  const setValue = useCallback(
    (patch: Partial<T>) => {
      const current = { ...defaults } as T;
      for (const key of Object.keys(defaults) as (keyof T)[]) {
        current[key] = (new URLSearchParams(search).get(String(key)) as T[keyof T]) ?? defaults[key];
      }
      const merged = { ...current, ...patch };
      const params: Record<string, string | null> = {};
      for (const [key, next] of Object.entries(merged)) {
        params[key] = next === "" ? null : next;
      }
      router.replace(replaceSearch(pathname, search, params), { scroll: false });
    },
    [defaults, pathname, router, search],
  );

  return [value, setValue];
}
