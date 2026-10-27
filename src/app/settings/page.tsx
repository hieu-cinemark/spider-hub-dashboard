"use client";

import { ClockCircleOutlined, FilterOutlined, GlobalOutlined, KeyOutlined, RobotOutlined, TagsOutlined } from "@ant-design/icons";
import { Button, Tabs, Typography } from "antd";
import dynamic from "next/dynamic";
import Link from "next/link";
import AccountsTable from "@/components/settings/AccountsTable";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import SettingsSummary from "@/components/settings/SettingsSummary";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useTranslation } from "@/i18n/LocaleProvider";
import { TabSkeleton } from "@/components/PageSkeleton";

// Mỗi tab Settings là một panel riêng với bảng/modal nặng (Omar, AI, lịch
// thu thập...). Chỉ tab đang mở mới cần code của nó, nên tất cả đều được
// nạp động: bundle ban đầu của /settings chỉ còn phần khung + tab mặc
// định, các tab còn lại tải sau khi người dùng bấm vào.
const ProxiesTable = dynamic(() => import("@/components/settings/ProxiesTable"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const ProxyProvidersCard = dynamic(() => import("@/components/settings/ProxyProvidersCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const ProxySettingsCard = dynamic(() => import("@/components/settings/ProxySettingsCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const CrawlScheduleCard = dynamic(() => import("@/components/settings/CrawlScheduleCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const CommentScheduleCard = dynamic(() => import("@/components/settings/CommentScheduleCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const CleanupScheduleCard = dynamic(() => import("@/components/settings/CleanupScheduleCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const AutoLoginCard = dynamic(() => import("@/components/settings/AutoLoginCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const FilterKeywordsTable = dynamic(() => import("@/components/settings/FilterKeywordsTable"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const AiSettingsCard = dynamic(() => import("@/components/settings/AiSettingsCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const AiProvidersCard = dynamic(() => import("@/components/settings/AiProvidersCard"), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

export default function SettingsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useQueryParam("tab", "accounts-proxies");
  return (
    <div className="flex flex-col gap-6">
      <Tabs
        className="ui-tabs"
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "accounts-proxies",
            label: (
              <span className="inline-flex items-center gap-2">
                <KeyOutlined /> {t("tabAccounts")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <SettingsSummary />
                <AccountsTable />
              </div>
            ),
          },
          {
            key: "proxies",
            label: (
              <span className="inline-flex items-center gap-2">
                <GlobalOutlined /> {t("tabProxies")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <ProxiesTable />
                <ProxyProvidersCard />
                <ProxySettingsCard />
              </div>
            ),
          },
          {
            key: "crawl-schedule",
            label: (
              <span className="inline-flex items-center gap-2">
                <ClockCircleOutlined /> {t("tabCrawlSchedule")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <CrawlScheduleCard />
                <CommentScheduleCard />
                <CleanupScheduleCard />
                <AutoLoginCard />
              </div>
            ),
          },
          {
            key: "filter-keywords",
            label: (
              <span className="inline-flex items-center gap-2">
                <FilterOutlined /> {t("tabFilterKeywords")}
              </span>
            ),
            children: (
              <div className="animate-fade-in-up">
                <FilterKeywordsTable />
              </div>
            ),
          },
          {
            key: "ai",
            label: (
              <span className="inline-flex items-center gap-2">
                <RobotOutlined /> {t("tabAi")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <AiSettingsCard />
                <AiProvidersCard />
              </div>
            ),
          },
          {
            key: "omar",
            label: (
              <span className="inline-flex items-center gap-2">
                <TagsOutlined /> {t("tabOmar")}
              </span>
            ),
            children: (
              <div className="flex flex-col gap-4 animate-fade-in-up">
                <DashboardCard
                  title={
                    <CardHeading
                      icon={<TagsOutlined />}
                      title={t("tabOmar")}
                      desc={t("omarMovedToTikTok")}
                    />
                  }
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Typography.Text type="secondary" className="text-sm">
                      {t("omarMovedToTikTokHint")}
                    </Typography.Text>
                    <Link href="/?tab=tiktok&sub=omar">
                      <Button type="primary" icon={<TagsOutlined />}>
                        {t("omarOpenInTikTok")}
                      </Button>
                    </Link>
                  </div>
                </DashboardCard>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
