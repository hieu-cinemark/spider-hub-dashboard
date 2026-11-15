"use client";

import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { App, Button, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";

/**
 * Copy a technical identifier to the clipboard.
 *
 * Long ids (account ids, session ids, proxy addresses) are unreadable in a
 * table cell but still needed often - in a support ticket, in a shell
 * command. The value is truncated for display but always recoverable: this
 * button puts the full string on the clipboard in one click.
 */
export default function CopyButton({
  value,
  label,
  size = "small",
}: {
  value: string | number | null | undefined;
  label?: string;
  size?: "small" | "middle";
}) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  if (value === null || value === undefined || value === "") return null;
  const text = String(value);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API needs a secure context; fall back to the legacy path.
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      } catch {
        message.error(t("copyFailed"));
      }
      document.body.removeChild(area);
    }
  }

  return (
    <Tooltip title={label ?? t("copyValue")}>
      <Button
        type="text"
        size={size}
        aria-label={label ?? t("copyValue")}
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={copy}
        className="!px-1.5 !text-[var(--muted)] hover:!text-[var(--ink)]"
      />
    </Tooltip>
  );
}
