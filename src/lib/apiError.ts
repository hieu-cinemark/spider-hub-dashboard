import { ApiError } from "./api";
import type { TranslationKey } from "@/i18n/translations";

// cinemark-api's error.code -> a translated key. Closed set matching the
// AppError subclasses in app/core/errors.py; unmapped/missing codes (e.g. a
// network failure that never reached the server) fall through to the
// generic requestFailed/requestFailedStatus in translateApiError below.
const ERROR_CODE_KEYS: Record<string, TranslationKey> = {
  not_found: "errorNotFound",
  unauthorized: "errorUnauthorized",
  forbidden: "errorForbidden",
  no_saved_session: "errorNoSavedSession",
  conflict: "errorConflict",
  upstream_error: "couldNotReachApi",
  internal_error: "errorInternal",
};

export function translateApiError(err: unknown, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (err instanceof ApiError) {
    const key = err.code ? ERROR_CODE_KEYS[err.code] : undefined;
    if (key) return t(key);
    return t("requestFailedStatus", { status: err.status });
  }
  return t("requestFailed");
}
