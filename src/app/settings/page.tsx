"use client";

import { ClockCircleOutlined, KeyOutlined, SettingOutlined } from "@ant-design/icons";
import { Card, Tabs, Typography } from "antd";
import AccountsTable from "@/components/settings/AccountsTable";
import CronJobsTable from "@/components/settings/CronJobsTable";
import ProxiesTable from "@/components/settings/ProxiesTable";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Typography.Title level={3} className="!mb-0">
        <SettingOutlined className="mr-2" />
        Settings
      </Typography.Title>

      <Card>
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
                <div className="flex flex-col gap-8">
                  <div>
                    <Typography.Title level={5}>Accounts</Typography.Title>
                    <AccountsTable />
                  </div>
                  <div>
                    <Typography.Title level={5}>Proxies</Typography.Title>
                    <ProxiesTable />
                  </div>
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
      </Card>
    </div>
  );
}
