import type { TranslationKey } from "@/i18n/translations";

// account.last_check_status is a plain string column (see cinemark-api's
// app/services/account_health.py), not a shared enum - "unknown" here is a
// real value the backend can return (no health-check strategy for this
// platform yet, e.g. instagram), distinct from `null` (never checked at
// all, see checkStatusLabelKey below).
const KNOWN_STATUSES = ["ok", "warning", "disabled", "unknown"] as const;
type CheckStatus = (typeof KNOWN_STATUSES)[number];

const LABEL_KEYS: Record<CheckStatus, TranslationKey> = {
  ok: "checkStatusOk",
  warning: "checkStatusWarning",
  disabled: "checkStatusDisabled",
  unknown: "checkStatusUnknown",
};

const TAG_COLORS: Record<CheckStatus, string> = {
  ok: "success",
  warning: "warning",
  disabled: "default",
  unknown: "default",
};

function normalize(status: string | null | undefined): CheckStatus | null {
  return status && (KNOWN_STATUSES as readonly string[]).includes(status) ? (status as CheckStatus) : null;
}

// `null` (never checked yet) gets its own label - distinct from the
// backend's own "unknown" status (checked, but this platform has no
// health-check strategy implemented).
export function checkStatusLabelKey(status: string | null | undefined): TranslationKey {
  const known = normalize(status);
  return known ? LABEL_KEYS[known] : "checkNeverChecked";
}

export function checkStatusTagColor(status: string | null | undefined): string {
  const known = normalize(status);
  return known ? TAG_COLORS[known] : "default";
}
