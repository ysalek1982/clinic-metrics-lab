import { cn } from "@/lib/utils";
import { viewSourceLabel, type ViewSourceState } from "@/lib/view-source";

const badgeStyles: Record<ViewSourceState, string> = {
  real: "border-risk-low/30 bg-risk-low/10 text-risk-low",
  fallback: "border-risk-moderate/30 bg-risk-moderate/10 text-risk-moderate",
  demo: "border-border bg-surface-raised/60 text-muted-foreground",
};

export function SourceStateBadge({ source, className }: { source: ViewSourceState; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-wider",
        badgeStyles[source],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {viewSourceLabel(source)}
    </span>
  );
}
