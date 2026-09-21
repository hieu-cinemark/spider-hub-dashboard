"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export const THEME_STORAGE_KEY = "spider-hub-dashboard.theme";
export type ColorTheme = "light" | "dark";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readStoredTheme(): ColorTheme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

function getSnapshot(): ColorTheme {
  return readStoredTheme();
}

function getServerSnapshot(): ColorTheme {
  return "light";
}

function applyDomTheme(theme: ColorTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function setStoredTheme(next: ColorTheme): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  applyDomTheme(next);
  notify();
}

interface ThemeContextValue {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useLayoutEffect(() => {
    applyDomTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setStoredTheme(readStoredTheme() === "dark" ? "light" : "dark");
  }, []);

  const value = useMemo(() => ({ theme, setTheme: setStoredTheme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useColorTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ThemeProvider");
  return ctx;
}
