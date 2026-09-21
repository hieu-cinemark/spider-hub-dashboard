"use client";

import { Form, Input, Modal, Select, Switch } from "antd";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { FilterKeyword, FilterKeywordInput } from "@/lib/types";

export default function FilterKeywordFormModal({
  open,
  keyword,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  keyword: FilterKeyword | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: FilterKeywordInput) => void;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FilterKeywordInput>();

  const categoryOptions = [
    { value: "movie_relevant", label: t("filterCategoryMovieRelevant") },
    { value: "spam_offtopic", label: t("filterCategorySpamOfftopic") },
  ];

  useEffect(() => {
    if (open) {
      form.setFieldsValue(keyword ?? { keyword: "", category: "movie_relevant", enabled: true });
    }
  }, [open, keyword, form]);

  return (
    <Modal
      open={open}
      title={keyword ? t("editFilterKeyword") : t("addFilterKeyword")}
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      confirmLoading={loading}
      destroyOnHidden
      centered
      width={480}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="keyword" label={t("columnKeyword")} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="category" label={t("columnCategory")} rules={[{ required: true }]}>
          <Select options={categoryOptions} />
        </Form.Item>
        <Form.Item name="enabled" label={t("enabled")} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
