"use client";

import { RobotOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Radio, Select, Space, Switch, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useAiProviders, useAiSettings, useSetActiveAiProvider, useSetAiSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";

const TASK_LABEL_KEYS: Record<string, TranslationKey> = {
  relevance: "aiPromptTaskRelevance",
  post_relevance: "aiPromptTaskPostRelevance",
  sentiment: "aiPromptTaskSentiment",
  topics: "aiPromptTaskTopics",
  narrative: "aiPromptTaskNarrative",
  import_accounts: "aiPromptTaskImportAccounts",
  import_proxies: "aiPromptTaskImportProxies",
  diagnosis: "aiPromptTaskDiagnosis",
  selector: "aiPromptTaskSelector",
};

export default function AiSettingsCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useAiSettings();
  const save = useSetAiSettings();
  const { data: providers } = useAiProviders();
  const setActive = useSetActiveAiProvider();
  // Legacy "bee" row (pre-2026-10-22) is no longer read - not offered.
  const choices = (providers ?? []).filter((p) => p.key !== "bee" && p.base_url);
  const active = choices.find((p) => p.key === data?.active_provider);
  const providerLabel = (key: string) => (key === "beeknoee" ? "Bee" : key === "kira" ? "Kira" : key);
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState("");
  const [task, setTask] = useState("relevance");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setModel(data.model);
    const next: Record<string, string> = {};
    for (const prompt of data.prompts) {
      next[prompt.task] = prompt.system_prompt;
    }
    setDrafts(next);
    setTask((current) => (data.prompts.some((p) => p.task === current) ? current : (data.prompts[0]?.task ?? "relevance")));
  }, [data]);

  const current = useMemo(() => data?.prompts.find((p) => p.task === task), [data, task]);
  const currentDraft = drafts[task] ?? current?.system_prompt ?? "";

  function persist() {
    save.mutate({ enabled, model: model.trim(), prompts: drafts, active_report_provider: "bee" });
  }

  function resetPrompt() {
    if (!current) return;
    setDrafts((prev) => ({ ...prev, [task]: current.default_system_prompt }));
  }

  return (
    <DashboardCard
      title={<CardHeading icon={<RobotOutlined />} title={t("aiSettingsTitle")} desc={t("aiSettingsDesc")} />}
    >
      {!isLoading && data && !data.configured ? (
        <Alert type="warning" showIcon className="mb-4" message={t("aiSettingsNotConfigured")} />
      ) : null}
      <div className="mb-5 rounded-xl border border-[var(--border)] p-4">
        <Typography.Text strong>{t("aiActiveProvider")}</Typography.Text>
        <div className="mt-2">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={data?.active_provider}
            disabled={isLoading || setActive.isPending}
            onChange={(e) => setActive.mutate(e.target.value)}
            options={choices.map((p) => ({ value: p.key, label: providerLabel(p.key), disabled: !p.api_key_set }))}
          />
        </div>
        {active ? (
          <Typography.Paragraph type="secondary" className="!mb-0 !mt-2 text-xs">
            {t("aiActiveProviderSummary", {
              chat: active.model || "-",
              image: active.image_model || "-",
              decisions: active.decisions_path ? `${active.comment_model} / ${active.post_model}` : t("aiNoDecisions"),
            })}
          </Typography.Paragraph>
        ) : null}
        <Typography.Paragraph type="secondary" className="!mb-0 !mt-1 text-xs">
          {t("aiActiveProviderHint")}
        </Typography.Paragraph>
      </div>
      <Form layout="vertical" disabled={isLoading || save.isPending}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Switch checked={enabled} onChange={setEnabled} />
          <Typography.Text>{enabled ? t("aiSettingsEnabled") : t("aiSettingsDisabled")}</Typography.Text>
        </div>
        <Form.Item label={t("aiSettingsModel")} extra={t("aiSettingsModelHint")}>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="claude-opus-4-8" />
        </Form.Item>
        <Form.Item label={t("aiSettingsPromptTask")}>
          <Select
            value={task}
            onChange={setTask}
            options={(data?.prompts ?? []).map((prompt) => ({
              value: prompt.task,
              label: t(TASK_LABEL_KEYS[prompt.task] ?? "aiPromptTaskRelevance"),
            }))}
          />
        </Form.Item>
        <Form.Item label={t("aiSettingsSystemPrompt")}>
          <Input.TextArea
            value={currentDraft}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [task]: e.target.value }))}
            autoSize={{ minRows: 10, maxRows: 22 }}
          />
        </Form.Item>
        <Space>
          <Button type="primary" onClick={persist} loading={save.isPending}>
            {t("save")}
          </Button>
          <Button onClick={resetPrompt}>{t("aiSettingsResetPrompt")}</Button>
        </Space>
      </Form>
    </DashboardCard>
  );
}
