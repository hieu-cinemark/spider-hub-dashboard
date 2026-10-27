"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_LOCALE, translations, type Locale, type TranslationKey } from "./translations";

const STORAGE_KEY = "spider-hub-dashboard.locale";

// Bảng dịch tiếng Việt được nạp động - người dùng giao diện tiếng Anh
// không phải tải nó. Cho tới khi tải xong, các khoá dịch còn thiếu rơi
// về bản tiếng Anh (fallback ở `t` bên dưới) nên không có chỗ nào hiển thị
// trống.
let viDictionary: Record<TranslationKey, string> | null = null;
let viPromise: Promise<Record<TranslationKey, string>> | null = null;

function loadVi(): Promise<Record<TranslationKey, string>> {
  if (viPromise) return viPromise;
  viPromise = import("./translations.vi").then((mod) => {
    viDictionary = mod.vi as Record<TranslationKey, string>;
    return viDictionary;
  });
  return viPromise;
}

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

// Placeholder trong template: `{ten}`. `tên` có thể chứa ký tự không
// phải ASCII (tiếng Việt có dấu) - regex cũ chỉ nhận `\w` nên placeholder
// tiếng Việt không bao giờ được nội dung.
const PLACEHOLDER_RE = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

// Mọi `{...}` còn lại sau khi đã nội dung = placeholder hỏng (ví dụ
// "{tài khoản}" do ai đó dịch luôn tên biến). Chúng không được phép lộ
// ra giao diện.
const STRAY_BRACE_RE = /\{[^{}]*\}/g;

// Nội dung thiếu -> thay bằng dấu gạch ngang thay vì để lộ `{ten}` ra
// giao diện. Lộ placeholder thô là lỗi hiển thị mà người dùng thấy
// được (ví dụ "Tài khoản: {tài khoản}"); dấu gạch ngang cho biết
// "không có giá trị" mà không trông như lỗi cú pháp.
const MISSING = "—";

function interpolate(template: string | undefined, vars?: Record<string, string | number>): string {
  if (!template) return "";
  const filled = template.replace(PLACEHOLDER_RE, (match, name: string) => {
    if (!vars) return MISSING;
    if (name in vars) {
      const value = vars[name];
      return value === undefined || value === null || value === "" ? MISSING : String(value);
    }
    return MISSING;
  });
  // Dấu ngoặc còn sót = placeholder hỏng - thay bằng dấu gạch ngang thay
  // vì hiển thị nguyên xi "{tài khoản}" ra giao diện.
  return filled.replace(STRAY_BRACE_RE, MISSING);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Bảng dịch tiếng Việt được nạp động. Giữ trong state để `t` đổi
  // identity khi bảng tải xong - nếu không, các useMemo dựa trên `t`
  // (menu sidebar, danh sách nhãn) sẽ giữ nguyên chuỗi tiếng Anh đã
  // tính lúc đầu.
  const [viDict, setViDict] = useState<Record<TranslationKey, string> | null>(viDictionary);

  useEffect(() => {
    if (locale !== "vi" || viDict) return;
    let cancelled = false;
    void loadVi().then((dict) => {
      if (!cancelled) setViDict(dict);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, viDict]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dictionary: Record<TranslationKey, string> | undefined =
        locale === "vi" ? (viDict ?? undefined) : translations.en;
      return interpolate(dictionary?.[key] ?? translations.en[key], vars);
    },
    [locale, viDict],
  );

  const value = useMemo(() => ({ locale, setLocale: setStoredLocale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
