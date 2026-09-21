"use client";

import { CheckCircleOutlined, PauseCircleOutlined, GlobalOutlined, TeamOutlined } from "@ant-design/icons";
import StatCard from "@/components/StatCard";
import { useAccounts, useProxies } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";

// Reads from the same useAccounts()/useProxies() query cache the tables
// below already populate (React Query dedupes by key, so this doesn't
// trigger an extra network round trip) - just a different view over the
// same data.
export default function SettingsSummary() {
  const { t } = useTranslation();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: proxies, isLoading: proxiesLoading } = useProxies();

  const totalAccounts = accounts?.length ?? 0;
  const activeAccounts = accounts?.filter((a) => a.enabled).length ?? 0;
  const pausedAccounts = totalAccounts - activeAccounts;
  const activeProxies = proxies?.filter((p) => p.enabled).length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard title={t("totalAccountsStat")} value={totalAccounts} icon={<TeamOutlined />} loading={accountsLoading} />
      <StatCard
        title={t("activeAccountsStat")}
        value={activeAccounts}
        icon={<CheckCircleOutlined />}
        color="#52c41a"
        loading={accountsLoading}
      />
      <StatCard
        title={t("pausedAccountsStat")}
        value={pausedAccounts}
        icon={<PauseCircleOutlined />}
        color="#faad14"
        loading={accountsLoading}
      />
      <StatCard
        title={t("activeProxiesStat")}
        value={activeProxies}
        icon={<GlobalOutlined />}
        color="#13c2c2"
        loading={proxiesLoading}
      />
    </div>
  );
}
