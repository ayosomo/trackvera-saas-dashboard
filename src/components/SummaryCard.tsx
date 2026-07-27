import type { ReactNode } from "react";

interface SummaryCardProps {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
  tone: "ink" | "green" | "amber" | "blue";
}

export function SummaryCard({
  label,
  value,
  detail,
  icon,
  tone,
}: SummaryCardProps) {
  return (
    <article className="summary-card">
      <div className={`summary-card__icon summary-card__icon--${tone}`}>
        {icon}
      </div>
      <div>
        <p className="summary-card__label">{label}</p>
        <p className="summary-card__value">{value}</p>
        <p className="summary-card__detail">{detail}</p>
      </div>
    </article>
  );
}
