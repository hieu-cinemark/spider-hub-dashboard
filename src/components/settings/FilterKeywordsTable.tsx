"use client";

import { DeleteOutlined, EditOutlined, FilterOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Switch, Table, Tag } from "antd";
import { useState } from "react";
import DashboardCard, { CardHeading } from "@/components/DashboardCard";
import { ItemCard, ItemCardList, ItemField } from "@/components/ItemCards";
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
        columns={[
          { title: t("columnKeyword"), dataIndex: "keyword", ellipsis: true },
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
        ]}
      />
      ) : (
        <ItemCardList items={keywords ?? []} loading={isLoading} rowKey={(k) => String(k.id)} pagination={paging}>
          {(record) => (
            <ItemCard>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="font-medium">{record.keyword}</span>
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
              </div>
              <ItemField label={t("columnCategory")}>
                <Tag color={CATEGORY_COLOR[record.category]}>{categoryLabel[record.category]}</Tag>
              </ItemField>
              <ItemField label={t("enabled")}>
                <Switch
                  size="small"
                  checked={record.enabled}
                  loading={update.isPending && update.variables?.id === record.id}
                  onChange={(checked) => update.mutate({ id: record.id, input: { enabled: checked } })}
                />
              </ItemField>
            </ItemCard>
          )}
        </ItemCardList>
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
