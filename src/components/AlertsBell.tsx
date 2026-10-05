"use client";

import { BellOutlined, CheckCircleOutlined, CloseCircleFilled, WarningFilled } from "@ant-design/icons";
import { Badge, Button, Popover } from "antd";
import Link from "next/link";
import { useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function AlertsBell() {
  const { t } = useTranslation();
  const alerts = useAlerts();
  const [open, setOpen] = useState(false);
  const errors = alerts.filter((a) => a.level === "error").length;

  const content = (
    <div className="flex w-[320px] max-w-[80vw] flex-col">
      {alerts.length === 0 ? (
        <div className="flex items-center gap-2 py-2 text-sm text-[var(--muted)]">
          <CheckCircleOutlined className="text-[var(--ok)]" /> {t("alertsEmpty")}
        </div>
      ) : (
        alerts.map((alert) => (
          <Link
            key={alert.key}
            href={alert.href}
            onClick={() => setOpen(false)}
            className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm text-[var(--ink)] no-underline hover:bg-[var(--paper-deep)]"
          >
            {alert.level === "error" ? (
              <CloseCircleFilled className="mt-0.5 text-[var(--danger)]" />
            ) : (
              <WarningFilled className="mt-0.5 text-[var(--warn)]" />
            )}
            <span className="leading-snug">{alert.text}</span>
          </Link>
        ))
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={t("alertsTitle")}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <Badge count={alerts.length} size="small" color={errors > 0 ? "#e11d48" : "#d97706"} offset={[-4, 4]}>
        <Button type="text" shape="circle" icon={<BellOutlined />} aria-label={t("alertsTitle")} />
      </Badge>
    </Popover>
  );
}
