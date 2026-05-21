import type { ReactNode } from "react";
import { AlertTriangle, Ban, Clock, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModuleStateTone = "default" | "loading" | "empty" | "error" | "forbidden" | "warning";

type ModuleStateProps = {
  tone?: ModuleStateTone;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  };
  className?: string;
};

const toneStyles: Record<ModuleStateTone, { icon: ReactNode; className: string; eyebrow: string }> = {
  default: {
    icon: <Database className="h-4 w-4" />,
    className: "border-border bg-surface/70 text-muted-foreground",
    eyebrow: "Estado del modulo",
  },
  loading: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    className: "border-primary/25 bg-primary/8 text-primary",
    eyebrow: "Cargando",
  },
  empty: {
    icon: <Database className="h-4 w-4" />,
    className: "border-border bg-surface/70 text-muted-foreground",
    eyebrow: "Sin datos",
  },
  error: {
    icon: <AlertTriangle className="h-4 w-4" />,
    className: "border-risk-critical/35 bg-risk-critical/10 text-risk-critical",
    eyebrow: "Error controlado",
  },
  forbidden: {
    icon: <Ban className="h-4 w-4" />,
    className: "border-risk-high/35 bg-risk-high/10 text-risk-high",
    eyebrow: "Acceso restringido",
  },
  warning: {
    icon: <Clock className="h-4 w-4" />,
    className: "border-risk-moderate/35 bg-risk-moderate/10 text-risk-moderate",
    eyebrow: "Configuracion pendiente",
  },
};

export function ModuleState({
  tone = "default",
  eyebrow,
  title,
  description,
  children,
  action,
  className,
}: ModuleStateProps) {
  const styles = toneStyles[tone];
  const button = action?.href ? (
    <Button asChild variant="outline" size="sm" disabled={action.disabled}>
      <a href={action.href}>{action.label}</a>
    </Button>
  ) : action ? (
    <Button variant="outline" size="sm" onClick={action.onClick} disabled={action.disabled}>
      {action.label}
    </Button>
  ) : null;

  return (
    <section
      className={cn(
        "panel relative overflow-hidden p-5",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/35 before:to-transparent",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 rounded-md border p-2", styles.className)}>{styles.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {eyebrow ?? styles.eyebrow}
          </div>
          <h2 className="mt-1 text-[17px] font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted-foreground">{description}</p>}
          {children && <div className="mt-4">{children}</div>}
          {button && <div className="mt-4">{button}</div>}
        </div>
      </div>
    </section>
  );
}
