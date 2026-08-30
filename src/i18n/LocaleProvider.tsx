"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_LOCALE, translations, type Locale, type TranslationKey } from "./translations";

const STORAGE_KEY = "spider-hub-dashboard.locale";

// Same useSyncExternalStore-based pattern as lib/auth.ts, for the same
// reason: reading localStorage inside a useEffect and calling setState from
// it is exactly the "cascading render" pattern React (and this project's
// lint config) wants avoided. useSyncExternalStore's snapshot is read
// during render instead, so the correct persisted locale shows up on the
// very first client render after hydration - no extra render, no lint
// exception needed.
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "vi" ? stored : DEFAULT_LOCALE;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function setStoredLocale(next: Locale): void {
  window.localStorage.setItem(STORAGE_KEY, next);
  notify();
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => interpolate(translations[locale][key], vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale: setStoredLocale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
