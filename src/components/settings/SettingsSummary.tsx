"use client";

import { CheckCircleOutlined, GlobalOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import StatCard from "@/components/StatCard";
import { useAccounts, useProxies } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { summarizeAccounts } from "@/lib/accountPool";
import { platformLabel } from "@/lib/platform";
import type { Proxy } from "@/lib/types";

function proxyUnhealthy(proxy: Proxy): boolean {
  if (proxy.pool_status === "degraded") return true;
  return !!proxy.cooldown_until && new Date(proxy.cooldown_until).getTime() > Date.now();
}

// Reads from the same useAccounts()/useProxies() query cache the tables
// below already populate (React Query dedupes by key, so this doesn't
// trigger an extra network round trip) - just a different view over the
// same data. Health-first: "enabled vs disabled" alone said nothing about
// how many accounts can actually crawl right now.
export default function SettingsSummary() {
  const { t } = useTranslation();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: proxies, isLoading: proxiesLoading } = useProxies();

  const summaries = summarizeAccounts(accounts ?? []);
  const sum = (key: "total" | "ready" | "dead" | "checkpoint" | "disabled") =>
    summaries.reduce((acc, row) => acc + row[key], 0);
  const issues = sum("dead") + sum("checkpoint");
  const byPlatform = summaries.map((row) => `${platformLabel(row.platform)} ${row.total}`).join(" · ");

  const enabledProxies = (proxies ?? []).filter((p) => p.enabled);
  const unhealthyProxies = enabledProxies.filter(proxyUnhealthy).length;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title={t("settingsKpiTotal")}
        value={sum("total")}
        icon={<TeamOutlined />}
        color="#4f46e5"
        loading={accountsLoading}
        hint={byPlatform || undefined}
      />
      <StatCard
        title={t("settingsKpiReady")}
        value={`${sum("ready")} / ${sum("total")}`}
        icon={<CheckCircleOutlined />}
        color="#047857"
        loading={accountsLoading}
        hint={t("settingsKpiDisabledHint", { n: sum("disabled") })}
      />
      <StatCard
        title={t("settingsKpiIssues")}
        value={issues}
        icon={<WarningOutlined />}
        color="#e11d48"
        tone={issues > 0 ? "danger" : undefined}
        loading={accountsLoading}
        href={issues > 0 ? "/settings?tab=accounts-proxies&status=dead" : undefined}
        hint={t("settingsKpiIssuesHint", { dead: sum("dead"), checkpoint: sum("checkpoint") })}
      />
      <StatCard
        title={t("settingsKpiProxies")}
        value={`${enabledProxies.length} / ${proxies?.length ?? 0}`}
        icon={<GlobalOutlined />}
        color="#0891b2"
        tone={unhealthyProxies > 0 ? "warning" : undefined}
        loading={proxiesLoading}
        hint={unhealthyProxies > 0 ? t("settingsKpiProxiesHint", { n: unhealthyProxies }) : undefined}
      />
    </div>
  );
}
