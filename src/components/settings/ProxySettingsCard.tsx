"use client";

import { ControlOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Select, Space, Typography } from "antd";
import { useEffect } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useProxyProviders, useProxySettings, useSetProxySettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import type { ProxySettings } from "@/lib/types";

type FieldKind = "int" | "float" | "url" | "provider";

interface FieldMeta {
  name: keyof ProxySettings;
  kind: FieldKind;
  label: TranslationKey;
  hint: TranslationKey;
  unit?: TranslationKey;
  min?: number;
  max?: number;
}

interface SectionMeta {
  title: TranslationKey;
  desc: TranslationKey;
  fields: FieldMeta[];
}

// Bounds mirror cinemark-api's ProxySettings (app/schemas/settings.py) so
// the form rejects what the API would reject, before a round trip.
const SECTIONS: SectionMeta[] = [
  {
    title: "proxySectionPinning",
    desc: "proxySectionPinningDesc",
    fields: [
      { name: "repin_after_consecutive_failures", kind: "int", label: "proxyRepinAfter", hint: "proxyRepinAfterHint", unit: "unitTimes", min: 1, max: 100 },
      { name: "cooldown_base_minutes", kind: "float", label: "proxyCooldownBase", hint: "proxyCooldownBaseHint", unit: "unitMinutes", min: 0.1, max: 240 },
      { name: "cooldown_max_minutes", kind: "float", label: "proxyCooldownMax", hint: "proxyCooldownMaxHint", unit: "unitMinutes", min: 0.1, max: 10080 },
    ],
  },
  {
    title: "proxySectionHealth",
    desc: "proxySectionHealthDesc",
    fields: [
      { name: "health_check_ping_url", kind: "url", label: "proxyPingUrl", hint: "proxyPingUrlHint" },
      { name: "health_check_timeout_seconds", kind: "float", label: "proxyPingTimeout", hint: "proxyPingTimeoutHint", unit: "unitSeconds", min: 1, max: 120 },
      { name: "health_check_alert_after_failures", kind: "int", label: "proxyAlertAfter", hint: "proxyAlertAfterHint", unit: "unitTimes", min: 1, max: 100 },
      { name: "health_check_streak_ttl_hours", kind: "float", label: "proxyStreakTtl", hint: "proxyStreakTtlHint", unit: "unitHours", min: 0.5, max: 168 },
    ],
  },
  {
    title: "proxySectionVendor",
    desc: "proxySectionVendorDesc",
    fields: [
      { name: "provider_request_timeout_seconds", kind: "float", label: "proxyVendorTimeout", hint: "proxyVendorTimeoutHint", unit: "unitSeconds", min: 1, max: 120 },
      { name: "provider_min_get_new_interval_seconds", kind: "float", label: "proxyVendorMinInterval", hint: "proxyVendorMinIntervalHint", unit: "unitSeconds", min: 0, max: 3600 },
      { name: "provider_max_cooldown_wait_seconds", kind: "float", label: "proxyVendorMaxWait", hint: "proxyVendorMaxWaitHint", unit: "unitSeconds", min: 0, max: 3600 },
    ],
  },
  {
    title: "proxySectionExhausted",
    desc: "proxySectionExhaustedDesc",
    fields: [
      { name: "exhausted_backoff_base_seconds", kind: "float", label: "proxyExhaustedBase", hint: "proxyExhaustedBaseHint", unit: "unitSeconds", min: 1, max: 3600 },
      { name: "exhausted_backoff_growth_factor", kind: "float", label: "proxyExhaustedGrowth", hint: "proxyExhaustedGrowthHint", unit: "unitTimesMultiplier", min: 1, max: 10 },
      { name: "exhausted_backoff_max_seconds", kind: "float", label: "proxyExhaustedMax", hint: "proxyExhaustedMaxHint", unit: "unitSeconds", min: 1, max: 86400 },
      { name: "exhausted_max_requeues", kind: "int", label: "proxyExhaustedRequeues", hint: "proxyExhaustedRequeuesHint", unit: "unitTimes", min: 0, max: 100 },
    ],
  },
  {
    title: "proxySectionTiktok",
    desc: "proxySectionTiktokDesc",
    fields: [
      { name: "tiktok_synthetic_provider", kind: "provider", label: "proxyTiktokProvider", hint: "proxyTiktokProviderHint" },
      { name: "tiktok_hashtag_max_attempts", kind: "int", label: "proxyTiktokHashtagAttempts", hint: "proxyTiktokHashtagAttemptsHint", unit: "unitTimes", min: 1, max: 50 },
      { name: "tiktok_comments_max_attempts", kind: "int", label: "proxyTiktokCommentsAttempts", hint: "proxyTiktokCommentsAttemptsHint", unit: "unitTimes", min: 1, max: 50 },
    ],
  },
];

export default function ProxySettingsCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useProxySettings();
  const { data: providers } = useProxyProviders();
  const save = useSetProxySettings();
  const [form] = Form.useForm<ProxySettings>();

  useEffect(() => {
    if (data) form.setFieldsValue(data.values);
  }, [data, form]);

  const defaults = data?.defaults;
  const providerOptions = (providers ?? []).map((p) => ({ value: p.key, label: p.key }));

  function renderInput(field: FieldMeta) {
    if (field.kind === "url") return <Input placeholder="https://" />;
    if (field.kind === "provider") return <Select options={providerOptions} loading={!providers} />;
    return (
      <InputNumber
        className="!w-full"
        min={field.min}
        max={field.max}
        step={field.kind === "int" ? 1 : 0.5}
        precision={field.kind === "int" ? 0 : undefined}
        addonAfter={field.unit ? t(field.unit) : undefined}
      />
    );
  }

  return (
    <DashboardCard
      loading={isLoading}
      title={<CardHeading icon={<ControlOutlined />} title={t("proxySettingsTitle")} desc={t("proxySettingsDesc")} />}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) => save.mutate({ ...data!.values, ...values })}
      >
        <div className="flex flex-col gap-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <Typography.Title level={5} className="!mb-0.5">
                {t(section.title)}
              </Typography.Title>
              <Typography.Paragraph type="secondary" className="!mb-3 text-xs">
                {t(section.desc)}
              </Typography.Paragraph>
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-3">
                {section.fields.map((field) => (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={t(field.label)}
                    rules={[{ required: true }, ...(field.kind === "url" ? [{ type: "url" as const }] : [])]}
                    extra={
                      <span>
                        {t(field.hint)}
                        {defaults ? (
                          <span className="text-[var(--muted)]"> {t("proxyDefaultValue", { value: String(defaults[field.name]) })}</span>
                        ) : null}
                      </span>
                    }
                  >
                    {renderInput(field)}
                  </Form.Item>
                ))}
              </div>
            </section>
          ))}
        </div>
        <Space className="mt-2" wrap>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            {t("save")}
          </Button>
          <Button disabled={!defaults} onClick={() => defaults && form.setFieldsValue(defaults)}>
            {t("proxyResetDefaults")}
          </Button>
          <Typography.Text type="secondary" className="text-xs">
            {t("proxySettingsApplyNote")}
          </Typography.Text>
        </Space>
      </Form>
    </DashboardCard>
  );
}
