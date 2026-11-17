"use client";

import { ControlOutlined } from "@ant-design/icons";
import { Button, Collapse, Form, Input, InputNumber, Select, Space, Switch } from "antd";
import { useEffect } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useProxyProviders, useProxySettings, useSetProxySettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import type { ProxySettings } from "@/lib/types";
import Hint from "@/components/Hint";

type FieldKind = "int" | "float" | "url" | "provider" | "switch" | "text";

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
      { name: "provider_min_call_interval_seconds", kind: "float", label: "proxyVendorMinInterval", hint: "proxyVendorMinIntervalHint", unit: "unitSeconds", min: 0, max: 3600 },
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
      { name: "tiktok_combine_search", kind: "switch", label: "proxyTiktokCombine", hint: "proxyTiktokCombineHint" },
    ],
  },
  {
    title: "crawlSectionPerformance",
    desc: "crawlSectionPerformanceDesc",
    fields: [
      { name: "lanes_total", kind: "int", label: "crawlLanesTotal", hint: "crawlLanesTotalHint", min: 4, max: 128 },
      { name: "youtube_lanes", kind: "int", label: "crawlYoutubeLanes", hint: "crawlYoutubeLanesHint", min: 0, max: 64 },
      { name: "public_pages_workers", kind: "int", label: "crawlPublicWorkers", hint: "crawlPublicWorkersHint", min: 0, max: 32 },
      { name: "youtube_filter_concurrency", kind: "int", label: "crawlYoutubeFilters", hint: "crawlYoutubeFiltersHint", min: 1, max: 12 },
      { name: "youtube_search_pages", kind: "int", label: "crawlYoutubePages", hint: "crawlYoutubePagesHint", min: 1, max: 200 },
      { name: "youtube_reply_pages", kind: "int", label: "crawlYoutubeReplyPages", hint: "crawlYoutubeReplyPagesHint", min: 0, max: 500 },
      { name: "youtube_comments_per_round", kind: "int", label: "crawlYoutubeCommentsPerRound", hint: "crawlYoutubeCommentsPerRoundHint", min: 0, max: 10000 },
      { name: "public_pages_per_proxy", kind: "int", label: "crawlPublicPerProxy", hint: "crawlPublicPerProxyHint", min: 1, max: 10 },
      { name: "public_pages_gap_seconds", kind: "float", label: "crawlPublicGap", hint: "crawlPublicGapHint", unit: "unitSeconds", min: 0, max: 600 },
      { name: "public_pages_queue_target", kind: "int", label: "crawlPublicQueue", hint: "crawlPublicQueueHint", min: 0, max: 500 },
      { name: "threads_channel_workers", kind: "int", label: "crawlThreadsWorkers", hint: "crawlThreadsWorkersHint", min: 0, max: 16 },
      { name: "threads_channels_queue_target", kind: "int", label: "crawlThreadsQueue", hint: "crawlThreadsQueueHint", min: 0, max: 200 },
      { name: "youtube_continuous", kind: "switch", label: "crawlYoutubeContinuous", hint: "crawlYoutubeContinuousHint" },
      { name: "youtube_transcripts", kind: "switch", label: "crawlYoutubeTranscripts", hint: "crawlYoutubeTranscriptsHint" },
      { name: "threads_channels_continuous", kind: "switch", label: "crawlThreadsContinuous", hint: "crawlThreadsContinuousHint" },
      { name: "public_comments_proxy_id", kind: "int", label: "crawlPubCommentsProxy", hint: "crawlPubCommentsProxyHint", min: 1, max: 1000000 },
      { name: "public_comments_daily_cap", kind: "int", label: "crawlPubCommentsDaily", hint: "crawlPubCommentsDailyHint", min: 1, max: 100000 },
      { name: "public_comments_interval_seconds", kind: "float", label: "crawlPubCommentsGap", hint: "crawlPubCommentsGapHint", unit: "unitSeconds", min: 1, max: 600 },
      { name: "public_comments_max_requests", kind: "int", label: "crawlPubCommentsJob", hint: "crawlPubCommentsJobHint", min: 1, max: 100000 },
    ],
  },
  {
    title: "crawlSectionPublic",
    desc: "crawlSectionPublicDesc",
    fields: [
      { name: "fb_public_discovery_proxy_id", kind: "int", label: "pubFbPublicDiscoveryProxyId", hint: "pubFbPublicDiscoveryProxyIdHint", min: 1, max: 1000000 },
      { name: "fb_public_pages_block_strikes", kind: "int", label: "pubFbPublicPagesBlockStrikes", hint: "pubFbPublicPagesBlockStrikesHint", min: 1, max: 20 },
      { name: "fb_public_pages_cooldown_minutes", kind: "int", label: "pubFbPublicPagesCooldownMinutes", hint: "pubFbPublicPagesCooldownMinutesHint", min: 1, max: 1440 },
      { name: "fb_public_pages_max_pages", kind: "int", label: "pubFbPublicPagesMaxPages", hint: "pubFbPublicPagesMaxPagesHint", min: 0, max: 1000 },
      { name: "fb_public_pages_since_days", kind: "int", label: "pubFbPublicPagesSinceDays", hint: "pubFbPublicPagesSinceDaysHint", min: 1, max: 3650 },
      { name: "fb_public_pages_window_days", kind: "int", label: "pubFbPublicPagesWindowDays", hint: "pubFbPublicPagesWindowDaysHint", min: 0, max: 365 },
      { name: "fb_public_pages_ip_check_seconds", kind: "int", label: "pubFbPublicPagesIpCheckSeconds", hint: "pubFbPublicPagesIpCheckSecondsHint", min: 5, max: 3600 },
      { name: "fb_public_pages_request_interval", kind: "float", label: "pubFbPublicPagesRequestInterval", hint: "pubFbPublicPagesRequestIntervalHint", min: 0.0, max: 120.0 },
      { name: "fb_public_pages_max_pace", kind: "int", label: "pubFbPublicPagesMaxPace", hint: "pubFbPublicPagesMaxPaceHint", min: 1, max: 64 },
      { name: "fb_public_pages_min_rest_seconds", kind: "int", label: "pubFbPublicPagesMinRestSeconds", hint: "pubFbPublicPagesMinRestSecondsHint", min: 0, max: 86400 },
      { name: "fb_public_pages_doc_id", kind: "text", label: "pubFbPublicPagesDocId", hint: "pubFbPublicPagesDocIdHint" },
      { name: "fb_public_yield_to_search", kind: "switch", label: "pubFbPublicYieldToSearch", hint: "pubFbPublicYieldToSearchHint" },
      { name: "threads_channel_since_days", kind: "int", label: "pubThreadsChannelSinceDays", hint: "pubThreadsChannelSinceDaysHint", min: 1, max: 3650 },
      { name: "threads_channel_max_pages", kind: "int", label: "pubThreadsChannelMaxPages", hint: "pubThreadsChannelMaxPagesHint", min: 1, max: 500 },
      { name: "threads_channel_request_interval", kind: "float", label: "pubThreadsChannelRequestInterval", hint: "pubThreadsChannelRequestIntervalHint", min: 0.0, max: 120.0 },
      { name: "threads_channel_cooldown_minutes", kind: "int", label: "pubThreadsChannelCooldownMinutes", hint: "pubThreadsChannelCooldownMinutesHint", min: 1, max: 1440 },
      { name: "threads_channel_rotating_retries", kind: "int", label: "pubThreadsChannelRotatingRetries", hint: "pubThreadsChannelRotatingRetriesHint", min: 0, max: 20 },
      { name: "fb_logged_out_proxy_ids", kind: "text", label: "pubFbLoggedOutProxyIds", hint: "pubFbLoggedOutProxyIdsHint" },
      { name: "fb_logged_out_delay_seconds", kind: "float", label: "pubFbLoggedOutDelaySeconds", hint: "pubFbLoggedOutDelaySecondsHint", min: 0.0, max: 120.0 },
      { name: "fb_logged_out_jitter_seconds", kind: "float", label: "pubFbLoggedOutJitterSeconds", hint: "pubFbLoggedOutJitterSecondsHint", min: 0.0, max: 60.0 },
      { name: "fb_logged_out_block_strikes", kind: "int", label: "pubFbLoggedOutBlockStrikes", hint: "pubFbLoggedOutBlockStrikesHint", min: 1, max: 20 },
      { name: "fb_logged_out_cooldown_minutes", kind: "int", label: "pubFbLoggedOutCooldownMinutes", hint: "pubFbLoggedOutCooldownMinutesHint", min: 1, max: 1440 },
      { name: "youtube_proxy_rest_seconds", kind: "int", label: "pubYoutubeProxyRestSeconds", hint: "pubYoutubeProxyRestSecondsHint", min: 10, max: 86400 },
    ],
  },
  {
    title: "crawlSectionBudget",
    desc: "crawlSectionBudgetDesc",
    fields: [
      { name: "fb_daily_request_cap", kind: "int", label: "budFbDailyRequestCap", hint: "budFbDailyRequestCapHint", min: 0, max: 100000 },
      { name: "fb_cap_rest_until", kind: "text", label: "budFbCapRestUntil", hint: "budFbCapRestUntilHint" },
      { name: "fb_budget_periods", kind: "text", label: "budFbBudgetPeriods", hint: "budFbBudgetPeriodsHint" },
      { name: "fb_fresh_share", kind: "float", label: "budFbFreshShare", hint: "budFbFreshShareHint", min: 0, max: 1 },
      { name: "fb_hourly_request_cap", kind: "int", label: "budFbHourlyRequestCap", hint: "budFbHourlyRequestCapHint", min: 0, max: 100000 },
      { name: "threads_hourly_request_cap", kind: "int", label: "budThreadsHourlyRequestCap", hint: "budThreadsHourlyRequestCapHint", min: 0, max: 100000 },
      { name: "fb_fresh_periods", kind: "text", label: "budFbFreshPeriods", hint: "budFbFreshPeriodsHint" },
      { name: "fb_deep_periods", kind: "text", label: "budFbDeepPeriods", hint: "budFbDeepPeriodsHint" },
      { name: "fb_new_account_ramp", kind: "text", label: "budFbNewAccountRamp", hint: "budFbNewAccountRampHint" },
      { name: "fb_new_account_daily_cap", kind: "int", label: "budFbNewAccountDailyCap", hint: "budFbNewAccountDailyCapHint", min: 0, max: 100000 },
      { name: "fb_restart_daily_caps", kind: "text", label: "budFbRestartDailyCaps", hint: "budFbRestartDailyCapsHint" },
      { name: "fb_restart_idle_days", kind: "int", label: "budFbRestartIdleDays", hint: "budFbRestartIdleDaysHint", min: 0, max: 365 },
      { name: "fb_run_max_requests", kind: "int", label: "budFbRunMaxRequests", hint: "budFbRunMaxRequestsHint", min: 0, max: 100000 },
      { name: "fb_run_max_seconds", kind: "int", label: "budFbRunMaxSeconds", hint: "budFbRunMaxSecondsHint", min: 0, max: 86400 },
      { name: "fb_run_rest_seconds", kind: "int", label: "budFbRunRestSeconds", hint: "budFbRunRestSecondsHint", min: 0, max: 86400 },
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
    if (field.kind === "text") return <Input allowClear />;
    if (field.kind === "provider") return <Select options={providerOptions} loading={!providers} />;
    if (field.kind === "switch") return <Switch />;
    return (
      <InputNumber
        className="!w-full"
        min={field.min}
        max={field.max}
        step={field.kind === "int" ? 1 : 0.5}
        precision={field.kind === "int" ? 0 : undefined}
        suffix={field.unit ? <span className="text-xs text-[var(--muted)]">{t(field.unit)}</span> : undefined}
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
        {/* One collapsible group per section - 20+ tuning fields open at once
            made this card longer than the rest of the page. forceRender keeps
            every Form.Item mounted, so values in a closed group still save. */}
        <Collapse
          className="settings-collapse"
          defaultActiveKey={[SECTIONS[0].title]}
          items={SECTIONS.map((section) => ({
            key: section.title,
            forceRender: true,
            label: (
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--ink)]">{t(section.title)}</span>
                <span className="text-xs font-normal text-[var(--muted)]">{t(section.desc)}</span>
              </div>
            ),
            children: (
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-3">
                {section.fields.map((field) => (
                  <Form.Item
                    key={field.name}
                    name={field.name}
                    label={t(field.label)}
                    valuePropName={field.kind === "switch" ? "checked" : "value"}
                    rules={field.kind === "switch" || field.kind === "text" ? [] : [{ required: true }, ...(field.kind === "url" ? [{ type: "url" as const }] : [])]}
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
            ),
          }))}
        />
        <Space className="mt-4" wrap>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            {t("save")}
          </Button>
          <Button disabled={!defaults} onClick={() => defaults && form.setFieldsValue(defaults)}>
            {t("proxyResetDefaults")}
          </Button>
          <Hint text={t("proxySettingsApplyNote")} />
        </Space>
      </Form>
    </DashboardCard>
  );
}
