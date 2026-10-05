"use client";

import { Progress, Tag } from "antd";
import Link from "next/link";
import { useTranslation } from "@/i18n/LocaleProvider";
import { PlatformIcon, platformLabel } from "@/lib/platform";
import { platformChartColor } from "@/lib/chartSeries";
import type { AccountPoolSummary } from "@/lib/accountPool";
import { useColorTheme } from "@/theme/ThemeProvider";

export default function AccountPoolGauges({ summaries }: { summaries: AccountPoolSummary[] }) {
  const { t } = useTranslation();
  const { theme } = useColorTheme();
  const isDark = theme === "dark";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {summaries.map((row) => {
        const percent = row.total > 0 ? Math.round((row.ready / row.total) * 100) : 0;
        const issues = [
          row.dead > 0 && <Tag key="dead" color="error" className="!m-0">{t("accountPoolDead", { n: row.dead })}</Tag>,
          row.checkpoint > 0 && <Tag key="cp" color="volcano" className="!m-0">{t("accountPoolCheckpoint", { n: row.checkpoint })}</Tag>,
          row.cooldown > 0 && <Tag key="cd" color="warning" className="!m-0">{t("accountPoolCooldown", { n: row.cooldown })}</Tag>,
          row.disabled > 0 && <Tag key="off" className="!m-0">{t("accountPoolDisabled", { n: row.disabled })}</Tag>,
        ].filter(Boolean);
        return (
          <Link
            key={row.platform}
            href="/settings"
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--paper-deep)]/40 p-4 text-inherit no-underline transition-shadow hover:shadow-md"
          >
            <Progress
              type="dashboard"
              percent={percent}
              size={116}
              strokeWidth={10}
              strokeColor={platformChartColor(row.platform, isDark)}
              format={() => (
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[26px] font-semibold tabular-nums text-[var(--ink)]">
                    {row.ready}
                    <span className="text-sm font-medium text-[var(--muted)]">/{row.total}</span>
                  </span>
                  <span className="text-[11px] font-medium text-[var(--muted)]">{t("accountPoolReady")}</span>
                </div>
              )}
            />
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
              <PlatformIcon platform={row.platform} /> {platformLabel(row.platform)}
            </div>
            <div className="flex min-h-[22px] flex-wrap justify-center gap-1">{issues}</div>
          </Link>
        );
      })}
    </div>
  );
}
