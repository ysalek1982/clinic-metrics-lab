import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/domain";

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Bajo",
  moderate: "Moderado",
  high: "Alto",
  critical: "Crítico",
};

const RISK_CLASSES: Record<RiskLevel, string> = {
  low: "bg-risk-low/12 text-risk-low border-risk-low/30",
  moderate: "bg-risk-moderate/12 text-risk-moderate border-risk-moderate/30",
  high: "bg-risk-high/12 text-risk-high border-risk-high/30",
  critical: "bg-risk-critical/15 text-risk-critical border-risk-critical/40",
};

export function RiskBadge({ level, size = "sm" }: { level: RiskLevel; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider",
        RISK_CLASSES[level],
        size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      {RISK_LABELS[level]}
    </span>
  );
}

export function RiskDot({ level, className }: { level: RiskLevel; className?: string }) {
  const colors: Record<RiskLevel, string> = {
    low: "bg-risk-low",
    moderate: "bg-risk-moderate",
    high: "bg-risk-high",
    critical: "bg-risk-critical animate-pulse-glow",
  };
  return <span className={cn("w-1.5 h-1.5 rounded-full inline-block", colors[level], className)} />;
}
