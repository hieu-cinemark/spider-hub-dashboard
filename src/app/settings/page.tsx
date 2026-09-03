"use client";

import { ClockCircleOutlined, KeyOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import AccountsTable from "@/components/settings/AccountsTable";
import CronJobsTable from "@/components/settings/CronJobsTable";
import ProxiesTable from "@/components/settings/ProxiesTable";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <Tabs
        items={[
          {
            key: "accounts-proxies",
            label: (
              <span>
                <KeyOutlined /> {t("tabProxyAccounts")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-6">
                <AccountsTable />
                <ProxiesTable />
              </div>
            ),
          },
          {
            key: "cron",
            label: (
              <span>
                <ClockCircleOutlined /> {t("tabCron")}
              </span>
            ),
            children: <CronJobsTable />,
          },
        ]}
      />
    </div>
  );
}
