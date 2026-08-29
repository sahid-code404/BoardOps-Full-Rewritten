import type { ReactNode } from "react";

type StatusTone = "info" | "success" | "warning" | "danger";

interface StatusChipProps {
  children: ReactNode;
  tone?: StatusTone;
}

export function StatusChip({ children, tone = "info" }: StatusChipProps) {
  return <span className={`bo-status bo-status--${tone}`}>{children}</span>;
}
