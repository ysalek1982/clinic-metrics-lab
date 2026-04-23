import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, meta, className }: Props) {
  return (
    <div className={cn("border-b border-border bg-surface/30", className)}>
      <div className="px-6 py-5 flex items-start justify-between gap-6">
        <div className="min-w-0">
          {meta && <div className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{meta}</div>}
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
