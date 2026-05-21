import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  unit: string;
  delta?: { value: number; direction: "up" | "down" | "flat"; positive?: "up" | "down" };
  hint: string;
  accent: string; // css var
  icon: ReactNode;
  sparkline: ReactNode;
}

export function KpiCard({ label, value, unit, delta, hint, accent, icon, sparkline }: Props) {
  const deltaColor = (() => {
    if (!delta) return "";
    if (delta.direction === "flat") return "text-muted-foreground";
    const goodDir = delta.positive ?? "up";
    const isGood = delta.direction === goodDir;
    return isGood ? "text-risk-low" : "text-risk-high";
  })();

  const DeltaIcon = delta?.direction === "up" ? TrendingUp : delta?.direction === "down" ? TrendingDown : Minus;

  return (
    <div
      className="panel p-4 relative overflow-hidden group hover:border-primary/25 hover:bg-surface/80 transition-colors"
      style={accent ? { boxShadow: `inset 3px 0 0 hsl(var(${accent}) / 0.6)` } : undefined}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {icon}
            <span className="truncate">{label}</span>
          </div>
          <div className="flex items-baseline gap-1 tabular">
            <span className="text-2xl font-semibold tracking-tight">{value}</span>
            {unit && <span className="text-[11px] text-muted-foreground font-mono">{unit}</span>}
          </div>
          {(delta || hint) && (
            <div className="flex items-center gap-2 text-[10px]">
              {delta && (
                <span className={cn("inline-flex items-center gap-0.5 font-mono tabular", deltaColor)}>
                  <DeltaIcon className="w-3 h-3" />
                  {delta.value > 0 ? "+" : ""}{delta.value}%
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        {sparkline && <div className="w-20 h-10 shrink-0 opacity-80">{sparkline}</div>}
      </div>
    </div>
  );
}
