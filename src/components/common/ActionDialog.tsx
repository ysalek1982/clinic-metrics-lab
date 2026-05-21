import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AsyncActionFooter } from "./AsyncActionFooter";

type ActionDialogProps = {
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
};

export function ActionDialog({
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
}: ActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className={cn("max-h-[92vh] max-w-2xl overflow-hidden border-border bg-surface text-foreground", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className="text-[12px] leading-5 text-muted-foreground">{description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[62vh] overflow-y-auto pr-1">{children}</div>
        {error && (
          <div className="flex gap-2 rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{error}</div>
          </div>
        )}
        {success && (
          <div className="flex gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12px] text-success" role="status">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{success}</div>
          </div>
        )}
        {footer ?? (
          <AsyncActionFooter
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
      </DialogContent>
    </Dialog>
  );
}
