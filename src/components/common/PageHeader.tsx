import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  title: ReactNode;
  subtitle: ReactNode;
  actions: ReactNode;
  meta: ReactNode;
  className: string;
}

export function PageHeader({ title, subtitle, actions, meta, className }: Props) {
  return (
    <div className={cn("border-b border-border bg-surface/55 shadow-[inset_0_-1px_0_hsl(var(--primary)/0.08)]", className)}>
      <div className="px-6 py-5 flex items-start justify-between gap-6 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_32%)]">
        <div className="min-w-0">
          {meta && <div className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{meta}</div>}
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-[13px] leading-5 text-muted-foreground mt-0.5 max-w-4xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
