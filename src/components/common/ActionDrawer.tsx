import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AsyncActionFooter } from "./AsyncActionFooter";

type ActionDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  loading?: boolean;
  error?: ReactNode;
  success?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  onSubmit?: () => void | Promise<void>;
  className?: string;
  footer?: ReactNode;
  side?: "left" | "right" | "top" | "bottom";
};

export function ActionDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  loading = false,
  error,
  success,
  disabled = false,
  destructive = false,
  submitLabel,
  cancelLabel,
  loadingLabel,
  onSubmit,
  className,
  footer,
  side = "right",
}: ActionDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <SheetContent side={side} className={cn("w-[calc(100vw-16px)] overflow-y-auto border-border bg-surface text-foreground sm:max-w-[720px]", className)}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription className="text-[12px] leading-5 text-muted-foreground">{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-6 space-y-4">{children}</div>
        {error && (
          <div className="mt-4 flex gap-2 rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{error}</div>
          </div>
        )}
        {success && (
          <div className="mt-4 flex gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12px] text-success" role="status">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{success}</div>
          </div>
        )}
        {footer ?? (
          <AsyncActionFooter
            className="mt-6"
            cancelLabel={cancelLabel}
            destructive={destructive}
            disabled={disabled}
            loading={loading}
            loadingLabel={loadingLabel}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
