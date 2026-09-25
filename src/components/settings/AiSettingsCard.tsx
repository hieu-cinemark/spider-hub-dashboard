"use client";

import { RobotOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Select, Space, Switch, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { useAiSettings, useSetAiSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { TranslationKey } from "@/i18n/translations";
import type { ReportAiProvider } from "@/lib/types";

const TASK_LABEL_KEYS: Record<string, TranslationKey> = {
  relevance: "aiPromptTaskRelevance",
  sentiment: "aiPromptTaskSentiment",
  topics: "aiPromptTaskTopics",
  narrative: "aiPromptTaskNarrative",
  import_accounts: "aiPromptTaskImportAccounts",
  import_proxies: "aiPromptTaskImportProxies",
  hashtag_bfs: "aiPromptTaskHashtagBfs",
  diagnosis: "aiPromptTaskDiagnosis",
  selector: "aiPromptTaskSelector",
};

export default function AiSettingsCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useAiSettings();
  const save = useSetAiSettings();
  const [enabled, setEnabled] = useState(false);
  const [model, setModel] = useState("");
  const [task, setTask] = useState("relevance");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeReportProvider, setActiveReportProvider] = useState<ReportAiProvider>("bee");

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setModel(data.model);
    setActiveReportProvider(data.active_report_provider);
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
    save.mutate({ enabled, model: model.trim(), prompts: drafts, active_report_provider: activeReportProvider });
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
      <Form layout="vertical" disabled={isLoading || save.isPending}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Switch checked={enabled} onChange={setEnabled} />
          <Typography.Text>{enabled ? t("aiSettingsEnabled") : t("aiSettingsDisabled")}</Typography.Text>
        </div>
        <Form.Item label={t("aiSettingsModel")} extra={t("aiSettingsModelHint")}>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="qwen3.8-flash" />
        </Form.Item>
        <Form.Item label={t("aiSettingsReportProvider")} extra={t("aiSettingsReportProviderHint")}>
          <Select<ReportAiProvider>
            value={activeReportProvider}
            onChange={setActiveReportProvider}
            options={[
              { value: "bee", label: "Bee (Claude Sonnet 5)" },
              { value: "kira", label: `Kira (${model || "..."})` },
            ]}
          />
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
