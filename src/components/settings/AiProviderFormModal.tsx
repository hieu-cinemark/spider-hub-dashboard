"use client";

import { Button, Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { useAiModels } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { AiProvider, AiProviderInput } from "@/lib/types";

// An AI provider is just: a name, a base URL, an API key and one model. The API never returns the raw key
// (AiProvider.api_key_set), so a blank key on save keeps the stored one; a brand-new provider needs a key.
export default function AiProviderFormModal({
  open,
  provider,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  provider: AiProvider | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (key: string, input: AiProviderInput) => void;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<AiProviderInput & { key: string }>();
  const [models, setModels] = useState<string[]>([]);
  const fetchModels = useAiModels();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        key: provider?.key ?? "",
        base_url: provider?.base_url ?? "",
        api_key: "",
        model: provider?.model ?? "",
      });
    }
  }, [open, provider, form]);

  function loadModels() {
    const { base_url, api_key, key } = form.getFieldsValue();
    fetchModels.mutate(
      { base_url: base_url?.trim() ?? "", api_key: api_key?.trim() || undefined, key: provider?.key ?? (key?.trim() || undefined) },
      { onSuccess: (data) => setModels(data.models) },
    );
  }

  return (
    <Modal
      open={open}
      title={provider ? t("editAiProvider") : t("addAiProvider")}
      onCancel={onCancel}
      onOk={() =>
        form.validateFields().then(({ key, ...input }) => {
          onSubmit(key.trim(), { ...input, model: input.model.trim(), api_key: input.api_key?.trim() || undefined });
        })
      }
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={520}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="key"
          label={t("aiProviderKey")}
          tooltip={t("aiProviderKeyHint")}
          rules={[{ required: true }, { pattern: /^[a-z0-9_-]+$/, message: t("aiProviderKeyInvalid") }]}
        >
          <Input placeholder="openai" disabled={!!provider} />
        </Form.Item>
        <Form.Item name="base_url" label={t("aiProviderBaseUrl")} rules={[{ required: true }]}>
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>
        <Form.Item
          name="api_key"
          label={t("aiProviderApiKey")}
          extra={provider ? t("aiProviderApiKeyHintKeep") : undefined}
          rules={provider ? [] : [{ required: true }]}
        >
          <Input.Password placeholder={provider?.api_key_set ? "••••••••" : ""} autoComplete="off" />
        </Form.Item>
        <Form.Item label={t("aiProviderModel")} required>
          <div className="flex gap-2">
            <Form.Item name="model" noStyle rules={[{ required: true }]}>
              <Select
                showSearch
                allowClear
                className="min-w-0 flex-1"
                placeholder={t("aiProviderModelPlaceholder")}
                options={models.map((id) => ({ value: id, label: id }))}
                notFoundContent={null}
                // Free text is allowed: if the provider has no /models endpoint, type the model id and press Enter.
                onSearch={(value) => form.setFieldValue("model", value)}
              />
            </Form.Item>
            <Button onClick={loadModels} loading={fetchModels.isPending}>
              {t("aiFetchModels")}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
