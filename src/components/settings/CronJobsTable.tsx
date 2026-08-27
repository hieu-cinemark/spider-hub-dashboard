"use client";

import { Table, Typography } from "antd";
import { useCronJobs } from "@/hooks/useSettings";
import { formatRelativeTime } from "@/lib/format";
import type { CronJob } from "@/lib/types";

export default function CronJobsTable() {
  const { data: jobs, isLoading } = useCronJobs();

  return (
    <div className="flex flex-col gap-3">
      <Typography.Text type="secondary" className="text-xs">
        Read-only reference - these schedules live in a crontab or
        cinemark-scraper&apos;s wrangler.toml, not a database. Edit them at their
        source (see &quot;Source&quot; below), not here.
      </Typography.Text>
      <Table
        size="small"
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
    </div>
  );
}
