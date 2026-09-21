import type { TranslationKey } from "@/i18n/translations";

// Derived display status for the account/proxy pool's circuit-breaker
// fields (pool_status/cooldown_until - see cinemark-api's AccountOut/
// ProxyOut and spider-hub's services/db.py, which actually write them).
// Distinct from lib/accountHealth.ts's last_check_status - that one is a
// manual/periodic health check, this one is the live acquire/release
// outcome from the account or proxy's actual last crawl attempt.
export type PoolStatusKind = "account" | "proxy";

export interface PoolStatusInfo {
  labelKey: TranslationKey;
  tagColor: string;
}

export function poolStatusInfo(
  kind: PoolStatusKind,
  poolStatus: string,
  cooldownUntil: string | null,
  enabled: boolean,
): PoolStatusInfo {
  const cooling = cooldownUntil !== null && new Date(cooldownUntil).getTime() > Date.now();

  if (!enabled) {
    // enabled=false wins over everything else - an account/proxy someone
    // (or a hard failure) turned off shouldn't ever read as "Active" just
    // because pool_status/cooldown_until haven't independently been
    // touched. checkpoint is still called out by name when that's *why*
    // it's off (see db.record_account_outcome, which sets both together)
    // since that's more actionable than the generic "disabled" label.
    if (kind === "account" && poolStatus === "checkpoint") {
      return { labelKey: "poolStatusCheckpoint", tagColor: "error" };
    }
    return { labelKey: "poolStatusDisabled", tagColor: "default" };
  }
  if (kind === "account" && poolStatus === "checkpoint") {
    // Terminal until a human clears it (re-login/cookie-import) - see
    // spider-hub's db.record_account_outcome. No self-expiring cooldown,
    // so this always wins over the cooldown check above.
    return { labelKey: "poolStatusCheckpoint", tagColor: "error" };
  }
  if (cooling) {
    return { labelKey: "poolStatusCooldown", tagColor: "warning" };
  }
  if (kind === "proxy" && poolStatus === "degraded") {
    // Cooldown already expired but nothing has retried this proxy yet to
    // clear its status back to "active" - see db.record_proxy_outcome.
    return { labelKey: "poolStatusDegraded", tagColor: "default" };
  }
  return { labelKey: "poolStatusActive", tagColor: "success" };
}
