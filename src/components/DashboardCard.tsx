import { Card, type CardProps } from "antd";

// Thin wrapper standardizing the rounded-corner/soft-shadow card look across
// every page - swap in for antd's own <Card> wherever a page renders one, so
// changing the "house style" later only means editing this one file.
export default function DashboardCard({ className, ...props }: CardProps) {
  return (
    <Card
      className={`!rounded-2xl !border-[#f0f0f0] !shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ${className ?? ""}`}
      {...props}
    />
  );
}
