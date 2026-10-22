"use client";

import { Form, Input, Modal } from "antd";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { AiProvider, AiProviderInput } from "@/lib/types";

// api_key is deliberately never pre-filled (the API never returns the raw
// secret - see AiProvider.api_key_set) - leaving it blank on save keeps
// whatever is already stored, only overwriting it when the operator types
// a new one. Adding a brand-new provider (`provider` is null) has no
// existing secret to keep, so api_key is required there instead.
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

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        key: provider?.key ?? "",
        base_url: provider?.base_url ?? "",
        api_key: "",
        model: provider?.model ?? "",
        chat_path: provider?.chat_path ?? "/chat/completions",
        image_model: provider?.image_model ?? "",
        decisions_path: provider?.decisions_path ?? "",
        comment_model: provider?.comment_model ?? "",
        post_model: provider?.post_model ?? "",
      });
    }
  }, [open, provider, form]);

  return (
    <Modal
      open={open}
      title={provider ? t("editAiProvider") : t("addAiProvider")}
      onCancel={onCancel}
      onOk={() =>
        form.validateFields().then(({ key, ...input }) => {
          onSubmit(key.trim(), { ...input, api_key: input.api_key?.trim() || undefined });
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
          extra={t("aiProviderKeyHint")}
          rules={[{ required: true }, { pattern: /^[a-z0-9_-]+$/, message: t("aiProviderKeyInvalid") }]}
        >
          <Input placeholder="bee" disabled={!!provider} />
        </Form.Item>
        <Form.Item name="base_url" label={t("aiProviderBaseUrl")} rules={[{ required: true }]}>
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>
        <Form.Item name="chat_path" label={t("aiProviderChatPath")} extra={t("aiProviderChatPathHint")}>
          <Input placeholder="/chat/completions" />
        </Form.Item>
        <Form.Item name="model" label={t("aiProviderChatModel")} extra={t("aiProviderChatModelHint")} rules={[{ required: true }]}>
          <Input placeholder="qwen3.8-flash" />
        </Form.Item>
        <Form.Item name="image_model" label={t("aiProviderImageModel")} extra={t("aiProviderImageModelHint")}>
          <Input placeholder="agnes-image-2.1-flash" />
        </Form.Item>
        <Form.Item name="decisions_path" label={t("aiProviderDecisionsPath")} extra={t("aiProviderDecisionsPathHint")}>
          <Input placeholder="/decisions" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="comment_model" label={t("aiProviderCommentModel")}>
            <Input placeholder="typesafe/jev-1.14" />
          </Form.Item>
          <Form.Item name="post_model" label={t("aiProviderPostModel")}>
            <Input placeholder="openai/gpt-6-luna-decisions" />
          </Form.Item>
        </div>
        <Form.Item
          name="api_key"
          label={t("aiProviderApiKey")}
          extra={provider ? t("aiProviderApiKeyHintKeep") : undefined}
          rules={provider ? [] : [{ required: true }]}
        >
          <Input.Password placeholder={provider?.api_key_set ? "••••••••" : ""} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
