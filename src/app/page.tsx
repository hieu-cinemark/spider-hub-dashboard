"use client";

import { DashboardOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import PlatformTabs from "@/components/platform/PlatformTabs";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <Typography.Title level={3} className="!mb-0">
        <DashboardOutlined className="mr-2" />
        Overview
      </Typography.Title>
      <PlatformTabs />
    </div>
  );
}
