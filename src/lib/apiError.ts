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

const PROXY_POLICY_KEYS: Record<string, TranslationKey> = {
  rotating_ip: "proxyPolicyRotating",
  shared_ip: "proxyPolicyShared",
  public_proxy: "proxyPolicyPublic",
  ip_type_not_static: "proxyPolicyNotStatic",
};

const COOKIE_PROBLEM_KEYS: Record<string, TranslationKey> = {
  missing_c_user: "cookieProblemMissingCUser",
  missing_xs: "cookieProblemMissingXs",
  missing_datr: "cookieProblemMissingDatr",
  c_user_not_numeric: "cookieProblemCUserNotNumeric",
  c_user_mismatch: "cookieProblemCUserMismatch",
  xs_too_old: "cookieProblemXsTooOld",
  missing_user_agent: "cookieProblemMissingUa",
  user_agent_impossible_chrome_build: "cookieProblemImpossibleChrome",
  cookie_unreadable: "cookieProblemUnreadable",
};

export function translateApiError(err: unknown, t: (key: TranslationKey, vars?: Record<string, string | number>) => string): string {
  if (err instanceof ApiError) {
    // These carry a reason the operator must read to fix it, not just "request failed".
    if (err.code === "proxy_policy") {
      const reason = PROXY_POLICY_KEYS[err.message];
      return reason ? t(reason) : t("errorConflict");
    }
    if (err.code === "cookie_refused") {
      const problems = err.message.split(",").map((code) => {
        const problem = COOKIE_PROBLEM_KEYS[code];
        return problem ? t(problem) : code;
      });
      return t("errorCookieRefused", { problems: problems.join("; ") });
    }
    const key = err.code ? ERROR_CODE_KEYS[err.code] : undefined;
    if (key) return t(key);
    return t("requestFailedStatus", { status: err.status });
  }
  return t("requestFailed");
}
