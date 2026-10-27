"use client";

import { DeleteOutlined, EditOutlined, FilterOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Switch, Table, Tag } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import MobileTable, { type ResponsiveColumnType } from "@/components/MobileTable";
import FilterKeywordFormModal from "@/components/settings/FilterKeywordFormModal";
import { useMdUp } from "@/hooks/useMdUp";
import { usePagedList } from "@/hooks/usePagedList";
import { useFilterKeywordMutations, useFilterKeywords } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { FilterKeyword, FilterKeywordCategory, FilterKeywordInput } from "@/lib/types";

const CATEGORY_COLOR: Record<FilterKeywordCategory, string> = {
  movie_relevant: "blue",
  spam_offtopic: "red",
};

export default function FilterKeywordsTable() {
  const { t } = useTranslation();
  const mdUp = useMdUp();
  const { data: keywords, isLoading } = useFilterKeywords();
  const { create, update, remove } = useFilterKeywordMutations();
  const keywordPaging = usePagedList(keywords ?? []);
  const paging = keywordPaging.paging((n) => t("tableTotal", { n: n.toLocaleString() }));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FilterKeyword | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(keyword: FilterKeyword) {
    setEditing(keyword);
    setModalOpen(true);
  }

  function handleSubmit(input: FilterKeywordInput) {
    const mutation = editing ? update.mutateAsync({ id: editing.id, input }) : create.mutateAsync(input);
    mutation.then(() => setModalOpen(false));
  }

  const categoryLabel: Record<FilterKeywordCategory, string> = {
    movie_relevant: t("filterCategoryMovieRelevant"),
    spam_offtopic: t("filterCategorySpamOfftopic"),
  };

  const columns: ResponsiveColumnType<FilterKeyword>[] = [
    {
      title: t("columnKeyword"),
      dataIndex: "keyword",
      mobilePrimary: true,
      render: (v: string) => <span className="font-medium break-words">{v}</span>,
    },
    {
      title: t("columnCategory"),
      dataIndex: "category",
      width: 168,
      render: (category: FilterKeywordCategory) => (
        <Tag color={CATEGORY_COLOR[category]} className="!m-0">{categoryLabel[category]}</Tag>
      ),
    },
    {
      title: t("enabled"),
      dataIndex: "enabled",
      width: 80,
      align: "center",
      render: (enabled: boolean, record: FilterKeyword) => (
        <Switch
          size="small"
          checked={enabled}
          loading={update.isPending && update.variables?.id === record.id}
          onChange={(checked) => update.mutate({ id: record.id, input: { enabled: checked } })}
        />
      ),
    },
    {
      title: t("actions"),
      key: "actions",
      width: 88,
      align: "right",
      mobileHidden: true,
      render: (_: unknown, record: FilterKeyword) => (
        <div className="flex justify-end gap-1">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title={t("removeFilterKeywordConfirm")}
            onConfirm={() => remove.mutate(record.id)}
            okText={t("remove")}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <DashboardCard
      title={<CardHeading icon={<FilterOutlined />} title={t("filterKeywordsTitle")} desc={t("filterKeywordsDesc")} />}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t("addFilterKeyword")}
        </Button>
      }
    >
      {mdUp ? (
      <Table
        size="middle"
        loading={isLoading}
        rowKey="id"
        dataSource={keywords ?? []}
        pagination={paging}
        columns={columns}
      />
      ) : (
        <MobileTable
          loading={isLoading}
          rowKey={(k) => String(k.id)}
          dataSource={keywords ?? []}
          columns={columns}
          pagination={paging}
          title={(record) => (
            <div className="flex gap-1">
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
              <Popconfirm
                title={t("removeFilterKeywordConfirm")}
                onConfirm={() => remove.mutate(record.id)}
                okText={t("remove")}
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          )}
        />
      )}
      <FilterKeywordFormModal
        open={modalOpen}
        keyword={editing}
        loading={create.isPending || update.isPending}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </DashboardCard>
  );
}
