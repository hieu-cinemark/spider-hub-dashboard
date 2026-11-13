"use client";

import { ClockCircleOutlined, FilterOutlined, GlobalOutlined, KeyOutlined, RobotOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AccountsTable from "@/components/settings/AccountsTable";
import PageHeader from "@/components/PageHeader";
import SettingsSummary from "@/components/settings/SettingsSummary";
import { useTranslation } from "@/i18n/LocaleProvider";
import { TabSkeleton } from "@/components/PageSkeleton";

// Mỗi tab Settings là một panel riêng với bảng/modal nặng (AI, lịch
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

// Tab "Omar" đã bỏ khỏi Cài đặt - nội dung của nó nằm ở tab TikTok trong
// Tổng quan. Link cũ (`/settings?tab=omar`) vẫn phải mở được nên được
// chuyển hướng, không để trang trống.
const OMAR_TAB = "omar";
// Tab cũ gộp "Tài khoản" + "Proxy" thành một - nay tách riêng. Mọi link
// cũ (bookmark, tin nhắn) vẫn dùng tên tab này nên cần alias.
const LEGACY_ACCOUNTS_TAB = "accounts-proxies";

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "accounts";

  useEffect(() => {
    if (tab === OMAR_TAB) {
      router.replace("/?tab=tiktok&sub=omar", { scroll: false });
      return;
    }
    if (tab === LEGACY_ACCOUNTS_TAB) {
      // Giữ nguyên mọi query param khác (q, status...) - link cũ trỏ vào
      // một tài khoản cụ thể vẫn phải mở đúng tài khoản đó.
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "accounts");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [tab, pathname, router, searchParams]);

  const activeTab = tab === OMAR_TAB || tab === LEGACY_ACCOUNTS_TAB ? "accounts" : tab;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("navSettings")} description={t("settingsPageDesc")} />
      <Tabs
        className="ui-tabs"
        activeKey={activeTab}
        onChange={(next) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", next);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }}
        items={[
          {
            key: "accounts",
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
        ]}
      />
    </div>
  );
}
