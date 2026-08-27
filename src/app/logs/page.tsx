"use client";

import { CloudServerOutlined, FileTextOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Card, Tabs, Typography } from "antd";
import LogViewer from "@/components/LogViewer";

export default function LogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Typography.Title level={3} className="!mb-0">
        <FileTextOutlined className="mr-2" />
        Logs
      </Typography.Title>
      <Typography.Text type="secondary">
        Tails the two structlog console logs behind the crawl pipeline, read straight off disk by
        cinemark-api.
      </Typography.Text>

      <Card>
        <Tabs
          items={[
            {
              key: "spider-hub",
              label: (
                <span>
                  <RadarChartOutlined /> Crawl consumer (spider-hub)
                </span>
              ),
              children: <LogViewer kind="spider-hub" sourceLabel="spider-hub crawl_request_consumer.py" />,
            },
            {
              key: "ingest",
              label: (
                <span>
                  <CloudServerOutlined /> Ingest consumer (cinemark-api)
                </span>
              ),
              children: <LogViewer kind="ingest" sourceLabel="cinemark-api ingest_consumer" />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
