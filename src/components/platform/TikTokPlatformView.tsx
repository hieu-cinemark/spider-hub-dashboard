"use client";

import { AppstoreOutlined, KeyOutlined } from "@ant-design/icons";
import { Tabs } from "antd";
import dynamic from "next/dynamic";
import { ChartCardSkeleton } from "@/components/PageSkeleton";
import { useQueryParam } from "@/hooks/useQueryParam";
import { useTranslation } from "@/i18n/LocaleProvider";
import PlatformDetail from "@/components/platform/PlatformDetail";

const OmarTab = dynamic(() => import("@/components/omar/OmarTab"), {
  ssr: false,
  loading: () => <ChartCardSkeleton height={320} />,
});

/**
 * Omar (TikTok) chỉ phục vụ nền tảng TikTok, nên nó nằm thành sub-tab
 * ngay trong tab TikTok thay vì bị chôn dưới Cài đặt. "Tổng quan" giữ
 * lại phần thống kê + biểu đồ; "Omar" mở toàn bộ bảng điều khiển hashtag /
 * tìm kiếm / video đang nổi.
 *
 * Sub-tab cũng nằm trong URL (`?tab=tiktok&sub=omar`) để link từ Cài đặt
 * mở đúng chỗ, và để người dùng chia sẻ / F5 vẫn giữ nguyên.
 */
export default function TikTokPlatformView() {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useQueryParam("sub", "overview");

  return (
    <Tabs
      className="ui-tabs"
      activeKey={subTab}
      onChange={setSubTab}
      items={[
        {
          key: "overview",
          label: (
            <span className="inline-flex items-center gap-2">
              <AppstoreOutlined /> {t("tiktokTabOverview")}
            </span>
          ),
          children: (
            <div className="flex flex-col gap-4">
              <PlatformDetail platform="tiktok" />
            </div>
          ),
        },
        {
          key: "omar",
          label: (
            <span className="inline-flex items-center gap-2">
              <KeyOutlined /> {t("tiktokTabOmar")}
            </span>
          ),
          children: (
            <div className="flex flex-col gap-4">
              <OmarTab />
            </div>
          ),
        },
      ]}
    />
  );
}
