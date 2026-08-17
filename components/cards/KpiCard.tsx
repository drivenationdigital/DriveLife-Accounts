import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  valueColor?: string;
  featured?: boolean;
}

export function KpiCard({
  label,
  value,
  sub,
  valueColor,
  featured,
}: KpiCardProps) {
  return (
    <div className={cx("kpi", featured && "featured")}>
      <div className="kpi-label">{label}</div>
      <div
        className="kpi-value"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
