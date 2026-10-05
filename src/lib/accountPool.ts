import type { Account } from "@/lib/types";

export interface AccountPoolSummary {
  platform: string;
  total: number;
  ready: number;
  dead: number;
  checkpoint: number;
  cooldown: number;
  disabled: number;
}

// One bucket per account, first match wins. Checkpoint is called out even
// when the account is also disabled (spider-hub sets both together, see
// lib/poolStatus.ts) since it's the actionable reason; "dead" is the
// cookie check's verdict (logged out) on an otherwise-usable account.
export function accountBucket(account: Account): Exclude<keyof AccountPoolSummary, "platform" | "total"> {
  if (account.pool_status === "checkpoint") return "checkpoint";
  if (!account.enabled) return "disabled";
  if (account.cooldown_until && new Date(account.cooldown_until).getTime() > Date.now()) return "cooldown";
  if (account.last_check_status === "dead") return "dead";
  return "ready";
}

export function summarizeAccounts(accounts: Account[]): AccountPoolSummary[] {
  const byPlatform = new Map<string, AccountPoolSummary>();
  for (const account of accounts) {
    const row =
      byPlatform.get(account.platform) ??
      { platform: account.platform, total: 0, ready: 0, dead: 0, checkpoint: 0, cooldown: 0, disabled: 0 };
    row.total += 1;
    row[accountBucket(account)] += 1;
    byPlatform.set(account.platform, row);
  }
  return Array.from(byPlatform.values()).sort((a, b) => b.total - a.total);
}
