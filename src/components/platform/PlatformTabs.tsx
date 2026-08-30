"use client";

import { AppstoreOutlined } from "@ant-design/icons";
import { Alert, Skeleton, Tabs } from "antd";
import { useQueryParam } from "@/hooks/useQueryParam";
import { usePlatformStats } from "@/hooks/useStats";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PlatformIcon, platformLabel } from "@/lib/platform";
import AllPlatformsOverview from "./AllPlatformsOverview";
import PlatformDetail from "./PlatformDetail";

export default function PlatformTabs() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useQueryParam("tab", "all");
  const { data: stats, isLoading, error } = usePlatformStats();

  if (isLoading && !stats) return <Skeleton active paragraph={{ rows: 6 }} />;

  if (error && !stats) {
    return (
      <Alert
        type="error"
        showIcon
        title={t("couldNotReachApi")}
        description={error.message}
      />
    );
  }

  const platforms = (stats ?? []).map((s) => s.platform);

  return (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={[
        {
          key: "all",
          label: (
            <span>
              <AppstoreOutlined /> {t("allTab")}
            </span>
          ),
          children: <AllPlatformsOverview />,
        },
        ...platforms.map((platform) => ({
          key: platform,
          label: (
            <span>
              <PlatformIcon platform={platform} /> {platformLabel(platform)}
            </span>
          ),
          children: <PlatformDetail platform={platform} />,
        })),
      ]}
    />
  );
}
