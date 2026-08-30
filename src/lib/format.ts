import type { TranslationKey } from "@/i18n/translations";

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

// Takes `t` as a parameter rather than calling useTranslation() itself -
// this is a plain function used from inside table column `render`
// callbacks, not a component/hook, so it can't call a hook on its own;
// callers get `t` from their own top-level useTranslation() and pass it
// through.
export function formatRelativeTime(iso: string | null, t: Translate): string {
  if (!iso) return t("timeNever");
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return t("timeJustNow");
  if (minutes < 60) return t("timeMinutesAgo", { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("timeHoursAgo", { n: hours });
  const days = Math.round(hours / 24);
  return t("timeDaysAgo", { n: days });
}
