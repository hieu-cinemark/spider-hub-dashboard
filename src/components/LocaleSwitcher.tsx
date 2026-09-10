"use client";

import { useTranslation } from "@/i18n/LocaleProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/translations";

const LOCALE_LABEL: Record<Locale, string> = { en: "EN", vi: "VI" };

// "dark" (default) is tuned for the Sider's navy background (translucent
// white pill); "light" is for placing this on a white/light surface (the
// header) instead, where the dark-variant's near-invisible translucent
// white background and white-on-white selected state wouldn't read at all.
export default function LocaleSwitcher({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { locale, setLocale, t } = useTranslation();
  const isLight = variant === "light";

  return (
    <div
      className={`flex items-center gap-1 rounded-lg p-0.5 ${isLight ? "bg-black/5" : "bg-white/10"}`}
      role="group"
      aria-label={t("language")}
    >
      {SUPPORTED_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            option === locale
              ? isLight
                ? "bg-white text-[#0f172a] shadow-sm"
                : "bg-white text-[#0f172a]"
              : isLight
                ? "text-[#595959] hover:text-[#141414]"
                : "text-white/70 hover:text-white"
          }`}
        >
          {LOCALE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
