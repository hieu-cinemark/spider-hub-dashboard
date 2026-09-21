"use client";

import { DeleteOutlined, RobotOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Radio, Select, Space, Typography } from "antd";
import { useState } from "react";
import { useImportMutations } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import { TRIGGERABLE_PLATFORMS } from "@/lib/constants";
import { platformLabel } from "@/lib/platform";
import type { ImportRow, ImportTarget } from "@/lib/types";

const ACCOUNT_FIELD_LABELS: Record<string, string> = {
  account_id: "Account ID",
  password: "Password",
  totp_secret: "2FA",
  email: "Email",
  email_password: "Email password",
  cookie: "Cookie",
  token: "Token",
};

const PROXY_FIELD_LABELS: Record<string, string> = {
  proxy_url: "Proxy (host:port)",
  username: "Username",
  password: "Password",
  login_use_proxy: "Use for login",
};

// Step 1 (describe format + paste content, ask AI to parse) then step 2
// (review/edit/remove the parsed rows before actually writing them) -
// never a direct paste-to-DB path, since a parsing mistake here would
// silently write a real password/cookie into the wrong field. See
// cinemark-api's app/kira/import_parser.py for the actual parsing.
export default function ImportWithAiModal({ defaultTarget }: { defaultTarget: ImportTarget }) {
  const { t } = useTranslation();
  const { parse, commit } = useImportMutations();

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<ImportTarget>(defaultTarget);
  const [platform, setPlatform] = useState<string>(TRIGGERABLE_PLATFORMS[0]);
  const [formatHint, setFormatHint] = useState("");
  const [content, setContent] = useState("");
  const [rows, setRows] = useState<ImportRow[] | null>(null);

  const fieldLabels = target === "accounts" ? ACCOUNT_FIELD_LABELS : PROXY_FIELD_LABELS;

  function reset() {
    setFormatHint("");
    setContent("");
    setRows(null);
  }

  function openModal() {
    setTarget(defaultTarget);
    reset();
    setOpen(true);
  }

  function handleParse() {
    parse.mutate(
      { target, format_hint: formatHint, content },
      { onSuccess: (res) => setRows(res.rows) },
    );
  }

  function handleCommit() {
    if (!rows) return;
    commit.mutate(
      { target, platform, rows },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  }

  function updateRow(index: number, field: string, value: string) {
    setRows((prev) => (prev ? prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)) : prev));
  }

  function removeRow(index: number) {
    setRows((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <>
      <Button icon={<RobotOutlined />} onClick={openModal}>
        {t("importWithAiAction")}
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title={t("importWithAiTitle")}
        width={rows ? 720 : 520}
        destroyOnHidden
      >
        {!rows ? (
          <div className="flex flex-col gap-3">
            <Typography.Text type="secondary">{t("importWithAiDesc")}</Typography.Text>

            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t("importTargetLabel")}</div>
              <Radio.Group value={target} onChange={(e) => setTarget(e.target.value)} optionType="button">
                <Radio.Button value="accounts">{t("importTargetAccounts")}</Radio.Button>
                <Radio.Button value="proxies">{t("importTargetProxies")}</Radio.Button>
              </Radio.Group>
            </div>

            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t("platform")}</div>
              <Select
                className="w-full"
                value={platform}
                onChange={setPlatform}
                options={[
                  ...TRIGGERABLE_PLATFORMS.map((p) => ({ value: p, label: platformLabel(p) })),
                  ...(target === "proxies" ? [{ value: "all", label: t("allPlatformsShared") }] : []),
                ]}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t("importFormatLabel")}</div>
              <Input.TextArea
                rows={2}
                value={formatHint}
                onChange={(e) => setFormatHint(e.target.value)}
                placeholder={t("importFormatPlaceholder")}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-[var(--muted)]">{t("importContentLabel")}</div>
              <Input.TextArea
                rows={8}
                className="font-mono text-xs"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("importContentPlaceholder")}
              />
            </div>

            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={parse.isPending}
              disabled={!formatHint.trim() || !content.trim()}
              onClick={handleParse}
            >
              {t("importParseAction")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Typography.Text strong>{t("importPreviewTitle", { n: rows.length })}</Typography.Text>
              <div className="text-xs text-[var(--muted)]">{t("importPreviewDesc")}</div>
            </div>

            <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
              {rows.map((row, i) => (
                <div key={i} className="rounded-md border border-[#f0f0f0] p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <Typography.Text type="secondary" className="text-xs">
                      #{i + 1}
                    </Typography.Text>
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      title={t("removeRowAction")}
                      onClick={() => removeRow(i)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(fieldLabels).map((field) => (
                      <div key={field}>
                        <div className="text-[10px] text-[var(--muted)]">{fieldLabels[field]}</div>
                        <Input
                          size="small"
                          value={String(row[field] ?? "")}
                          onChange={(e) => updateRow(i, field, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Space>
              <Button onClick={() => setRows(null)}>{t("importBackAction")}</Button>
              <Button
                type="primary"
                loading={commit.isPending}
                disabled={rows.length === 0}
                onClick={handleCommit}
              >
                {t("importCommitAction", { n: rows.length })}
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </>
  );
}
