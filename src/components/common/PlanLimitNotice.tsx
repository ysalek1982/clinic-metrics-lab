import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanLimitNoticeProps = {
  title?: string;
  description: string;
  tone?: "info" | "warning" | "blocked";
  className?: string;
};

export function PlanLimitNotice({
  title = "Limite del plan",
  description,
  tone = "info",
  className,
}: PlanLimitNoticeProps) {
  const styles =
    tone === "blocked"
      ? "border-risk-high/30 bg-risk-high/10 text-risk-high"
      : tone === "warning"
        ? "border-risk-moderate/30 bg-risk-moderate/10 text-risk-moderate"
        : "border-primary/25 bg-primary/8 text-primary";

  return (
    <div className={cn("flex gap-2 rounded-md border px-3 py-2 text-[12px]", styles, className)} role="status">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 leading-5 text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
