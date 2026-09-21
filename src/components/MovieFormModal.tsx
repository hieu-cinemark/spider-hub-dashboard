"use client";

import { DatePicker, Form, Input, Modal } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { Movie, MovieInput } from "@/lib/types";

type FormValues = Omit<MovieInput, "released_at"> & { released_at?: Dayjs | null };

export default function MovieFormModal({
  open,
  movie,
  loading,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  movie: Movie | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (input: MovieInput) => void;
}) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        title: movie?.title ?? "",
        slug: movie?.slug ?? "",
        released_at: movie?.released_at ? dayjs(movie.released_at) : null,
        poster_url: movie?.poster_url ?? "",
        director: movie?.director ?? "",
        cast: movie?.cast ?? "",
        distributor: movie?.distributor ?? "",
        description: movie?.description ?? "",
      });
    }
  }, [open, movie, form]);

  function submit() {
    form.validateFields().then((values) => {
      const blank = (value?: string | null) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : null;
      };
      onSubmit({
        title: values.title!.trim(),
        slug: movie ? blank(values.slug) : undefined,
        released_at: values.released_at ? values.released_at.format("YYYY-MM-DD") : null,
        poster_url: blank(values.poster_url),
        director: blank(values.director),
        cast: blank(values.cast),
        distributor: blank(values.distributor),
        description: blank(values.description),
      });
    });
  }

  return (
    <Modal
      open={open}
      title={movie ? t("editMovie") : t("addMovie")}
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={loading}
      okText={t("save")}
      cancelText={t("cancel")}
      destroyOnHidden
      centered
      width={560}
    >
      <Form form={form} layout="vertical" requiredMark={false} className="pt-1">
        <Form.Item name="title" label={t("movieColumnTitle")} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        {movie ? (
          <Form.Item name="slug" label={t("movieFieldSlug")}>
            <Input />
          </Form.Item>
        ) : null}
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-3">
          <Form.Item name="released_at" label={t("movieColumnReleasedAt")}>
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="distributor" label={t("movieColumnDistributor")}>
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="poster_url" label={t("movieFieldPosterUrl")}>
          <Input />
        </Form.Item>
        <Form.Item name="director" label={t("movieColumnDirector")}>
          <Input />
        </Form.Item>
        <Form.Item name="cast" label={t("movieColumnCast")}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="description" label={t("movieColumnDescription")} className="!mb-0">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
