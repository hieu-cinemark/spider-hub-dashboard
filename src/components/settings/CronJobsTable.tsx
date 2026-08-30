"use client";

import { ClockCircleOutlined } from "@ant-design/icons";
import { Table, Typography } from "antd";
import DashboardCard from "@/components/DashboardCard";
import { useCronJobs } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { formatRelativeTime } from "@/lib/format";
import type { CronJob } from "@/lib/types";

export default function CronJobsTable() {
  const { t } = useTranslation();
  const { data: jobs, isLoading } = useCronJobs();

  return (
    <DashboardCard
      title={
        <div className="flex items-center gap-2 py-1">
          <ClockCircleOutlined className="text-[#2f54eb]" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#141414]">{t("cronJobsTitle")}</span>
            <span className="text-xs font-normal text-[#8c8c8c]">{t("cronJobsDesc")}</span>
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
          { title: t("columnJob"), dataIndex: "name" },
          { title: t("columnSchedule"), dataIndex: "schedule" },
          {
            title: t("columnSource"),
            dataIndex: "source",
            render: (v: string) => <span className="font-mono text-xs">{v}</span>,
          },
          { title: t("columnDescription"), dataIndex: "description" },
          {
            title: t("columnLastRun"),
            dataIndex: "last_run_at",
            render: (v: CronJob["last_run_at"]) =>
              v ? formatRelativeTime(v, t) : <Typography.Text type="secondary">{t("unknown")}</Typography.Text>,
          },
        ]}
      />
    </DashboardCard>
  );
}
