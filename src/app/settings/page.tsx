"use client";

import { ClockCircleOutlined, KeyOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import PageHeader from "@/components/PageHeader";
import AccountsTable from "@/components/settings/AccountsTable";
import CronJobsTable from "@/components/settings/CronJobsTable";
import ProxiesTable from "@/components/settings/ProxiesTable";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage the accounts and proxies spider-hub crawls with, and see when each cron job last ran."
      />

      <Tabs
        items={[
          {
            key: "accounts-proxies",
            label: (
              <span>
                <KeyOutlined /> Proxy &amp; Accounts
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
                <ClockCircleOutlined /> Cron
              </span>
            ),
            children: <CronJobsTable />,
          },
        ]}
      />
    </div>
  );
}
