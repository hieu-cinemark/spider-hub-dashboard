"use client";

import { Form, Input, Modal, Select } from "antd";
import { useEffect } from "react";
import { useMovies } from "@/hooks/useMovies";

export interface AddKeywordFormValues {
  movieId: string;
  keyword: string;
}

export default function AddKeywordModal({
  open,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: AddKeywordFormValues) => void;
}) {
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const [form] = Form.useForm<AddKeywordFormValues>();

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, form]);

  return (
    <Modal
      open={open}
      title="Add keyword"
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="movieId" label="Movie" rules={[{ required: true, message: "Pick a movie" }]}>
          <Select
            placeholder="Select a movie"
            loading={moviesLoading}
            showSearch
            optionFilterProp="label"
            options={(movies ?? []).map((m) => ({ value: m.id, label: m.title }))}
          />
        </Form.Item>
        <Form.Item name="keyword" label="Keyword" rules={[{ required: true, message: "Enter a keyword" }]}>
          <Input placeholder="e.g. phim Mưa Đỏ" autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}
