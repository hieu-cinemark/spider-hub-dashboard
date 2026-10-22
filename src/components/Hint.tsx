import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { ReactNode } from "react";

/** Icon (i) - lời giải thích chỉ hiện khi rê chuột / chạm, để card không bị ngợp chữ. */
export default function Hint({ text, className }: { text: ReactNode; className?: string }) {
  if (!text) return null;
  return (
    <Tooltip title={text} placement="topLeft" styles={{ root: { maxWidth: 380 } }}>
      <InfoCircleOutlined
        aria-label={typeof text === "string" ? text : undefined}
        className={`cursor-help text-[13px] text-[var(--muted)] hover:text-[var(--ink)] ${className ?? ""}`}
      />
    </Tooltip>
  );
}

/** Mô tả ngắn (số liệu, đếm) vẫn hiện thẳng; câu giải thích dài chuyển vào Hint. */
export const SHORT_DESC_MAX = 70;
