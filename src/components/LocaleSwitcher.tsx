"use client";

import { useTranslation } from "@/i18n/LocaleProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/translations";

const LOCALE_LABEL: Record<Locale, string> = { en: "EN", vi: "VI" };

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-white/10 p-0.5" role="group" aria-label={t("language")}>
      {SUPPORTED_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            option === locale ? "bg-white text-[#0f172a]" : "text-white/70 hover:text-white"
          }`}
        >
          {LOCALE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
