"use client";

import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, Popconfirm, Tooltip } from "antd";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "@/i18n/LocaleProvider";

/**
 * Một hành động trên dòng bảng.
 *
 * `label` là chữ hiện trong menu dropdown (và trong tooltip của nút).
 * `danger` = hành động phá huỷ dữ liệu (xoá, bỏ ghim, reset) - luôn nằm
 * CUỐI dropdown và tô đỏ.
 */
export interface TableAction {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  /** Bật/tắt hành động (vd nút đang loading). */
  disabled?: boolean;
  tooltip?: ReactNode;
  danger?: boolean;
  /**
   * Dùng thay cho nút mặc định khi hành động cần một nút riêng (vd nút có
   * trạng thái loading riêng). Element này được render thay cho `<Button>`,
   * không lồng Button vào Button.
   */
  element?: ReactNode;
  confirm?: {
    title: ReactNode;
    okText?: string;
    onConfirm: () => void;
  };
}

// Ngưỡng: từ 3 hành động trở lên thì gom phần còn lại vào dropdown.
// 1-2 hành động thì hiện thẳng - dropdown 1 mục chẳng thêm gì ngoài
// một cú bấm.
const DROPDOWN_THRESHOLD = 2;

function ActionButton({
  action,
  size,
  onDone,
}: {
  action: TableAction;
  size: "small" | "middle";
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const button = action.element ?? (
    <Button
      size={size}
      icon={action.icon}
      danger={action.danger}
      disabled={action.disabled}
      aria-label={action.label}
      onClick={action.onClick}
    />
  );

  const withConfirm = action.confirm ? (
    <Popconfirm
      title={action.confirm.title}
      okText={action.confirm.okText ?? t("remove")}
      okButtonProps={{ danger: true }}
      onConfirm={() => {
        action.confirm?.onConfirm();
        onDone?.();
      }}
    >
      {button}
    </Popconfirm>
  ) : (
    button
  );

  const tip = action.tooltip ?? action.label;
  return tip ? <Tooltip title={tip}>{withConfirm}</Tooltip> : withConfirm;
}

/**
 * Menu item có xác nhận.
 *
 * Popconfirm bọc quanh nhãn của menu item, và cú click vào nhãn bị
 * `stopPropagation` - nếu không, menu đóng (và coi như đã chọn item) trước
 * khi người dùng kịp bấm nút xác nhận.
 */
function ConfirmMenuItem({
  action,
  onDone,
}: {
  action: TableAction;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  if (!action.confirm) return null;
  return (
    <Popconfirm
      title={action.confirm.title}
      okText={action.confirm.okText ?? t("remove")}
      okButtonProps={{ danger: true }}
      onConfirm={() => {
        action.confirm?.onConfirm();
        onDone();
      }}
    >
      <span
        className="inline-flex items-center gap-1.5"
        onClick={(event) => event.stopPropagation()}
      >
        {action.icon}
        {action.label}
      </span>
    </Popconfirm>
  );
}

/**
 * Gom nút hành động của một dòng bảng.
 *
 * Quy tắc chung cho cả app:
 * - hành động chính (thường là "Sửa") luôn hiện ra ngoài;
 * - từ 3 hành động trở lên thì phần còn lại nằm trong dropdown;
 * - hành động nguy hiểm nằm CUỐI dropdown, màu đỏ, có xác nhận.
 */
export default function TableActions({
  actions,
  size = "small",
  align = "end",
  forceDropdown = false,
}: {
  actions: TableAction[];
  size?: "small" | "middle";
  align?: "start" | "end";
  /**
   * Ép dùng dropdown dù số hành động <= ngưỡng - dùng khi bảng đó quy
   * định riêng rằng mọi hành động phá huỷ phải nằm trong dropdown.
   */
  forceDropdown?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const visible = actions.filter((a) => Boolean(a.element) || Boolean(a.label));
  if (visible.length === 0) return null;

  const primary = visible[0];
  const rest = visible.slice(1);

  if (!forceDropdown && visible.length <= DROPDOWN_THRESHOLD) {
    return (
      <div className={`flex items-center gap-1 ${align === "end" ? "justify-end" : "justify-start"}`}>
        {visible.map((action) => (
          <ActionButton key={action.key} action={action} size={size} />
        ))}
      </div>
    );
  }

  // Hành động nguy hiểm luôn ở cuối dropdown.
  const ordered = [...rest.filter((a) => !a.danger), ...rest.filter((a) => a.danger)];
  const menuItems = ordered.map((action) =>
    action.confirm
      ? {
          key: action.key,
          danger: true,
          label: <ConfirmMenuItem action={action} onDone={() => setOpen(false)} />,
        }
      : {
          key: action.key,
          danger: action.danger,
          label: action.element ? (
            <span className="inline-flex items-center">{action.element}</span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {action.icon}
              {action.label}
            </span>
          ),
        },
  );

  return (
    <div className={`flex items-center gap-1 ${align === "end" ? "justify-end" : "justify-start"}`}>
      <ActionButton action={primary} size={size} />
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        trigger={["click"]}
        menu={{
          items: menuItems,
          onClick: ({ key }) => {
            const action = ordered.find((a) => a.key === key);
            if (!action || action.confirm) return;
            action.onClick?.();
            setOpen(false);
          },
        }}
      >
        <Button size={size} icon={<DownOutlined />} aria-label={t("moreActions")} />
      </Dropdown>
    </div>
  );
}
