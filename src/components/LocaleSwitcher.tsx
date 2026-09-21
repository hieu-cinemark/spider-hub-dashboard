"use client";

import { useTranslation } from "@/i18n/LocaleProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/translations";

const LOCALE_LABEL: Record<Locale, string> = { en: "EN", vi: "VI" };

export default function LocaleSwitcher({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { locale, setLocale, t } = useTranslation();
  const isLight = variant === "light";

  return (
    <div
      className={`flex items-center gap-1 rounded-full p-0.5 ${isLight ? "bg-[var(--paper-deep)]" : "bg-white/10"}`}
      role="group"
      aria-label={t("language")}
    >
      {SUPPORTED_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors ${
            option === locale
              ? isLight
                ? "bg-[var(--card)] text-[var(--ink)] shadow-sm"
                : "bg-white text-[#12141a]"
              : isLight
                ? "text-[var(--muted)] hover:text-[var(--ink)]"
                : "text-white/70 hover:text-white"
          }`}
        >
          {LOCALE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
