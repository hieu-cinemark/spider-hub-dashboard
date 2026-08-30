"use client";

import { ClockCircleOutlined } from "@ant-design/icons";
import { Table, Typography } from "antd";
import DashboardCard from "@/components/DashboardCard";
import { useCronJobs } from "@/hooks/useSettings";
import { formatRelativeTime } from "@/lib/format";
import type { CronJob } from "@/lib/types";

export default function CronJobsTable() {
  const { data: jobs, isLoading } = useCronJobs();

  return (
    <DashboardCard
      title={
        <div className="flex items-center gap-2 py-1">
          <ClockCircleOutlined className="text-[#2f54eb]" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#141414]">Cron jobs</span>
            <span className="text-xs font-normal text-[#8c8c8c]">
              Read-only - these schedules live in a crontab or cinemark-scraper&apos;s wrangler.toml, not a
              database. Edit them at their source (see &quot;Source&quot; below), not here.
            </span>
          </div>
        </div>
      }
    >
      <Table
        size="small"
        scroll={{ x: "max-content" }}
        loading={isLoading}
        rowKey="name"
        dataSource={jobs ?? []}
        pagination={false}
        columns={[
          { title: "Job", dataIndex: "name" },
          { title: "Schedule", dataIndex: "schedule" },
          { title: "Source", dataIndex: "source", render: (v: string) => <span className="font-mono text-xs">{v}</span> },
          { title: "Description", dataIndex: "description" },
          {
            title: "Last run",
            dataIndex: "last_run_at",
            render: (v: CronJob["last_run_at"]) => (v ? formatRelativeTime(v) : <Typography.Text type="secondary">unknown</Typography.Text>),
          },
        ]}
      />
    </DashboardCard>
  );
}
