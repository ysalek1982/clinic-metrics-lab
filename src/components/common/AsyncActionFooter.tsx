import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AsyncActionFooterProps = {
  submitLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  onCancel?: () => void;
  onSubmit?: () => void | Promise<void>;
  children?: ReactNode;
  className?: string;
};

export function AsyncActionFooter({
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  loadingLabel = "Guardando...",
  loading = false,
  disabled = false,
  destructive = false,
  onCancel,
  onSubmit,
  children,
  className,
}: AsyncActionFooterProps) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end", className)}>
      {children}
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
      )}
      {onSubmit && (
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          onClick={() => void onSubmit()}
          disabled={disabled || loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? loadingLabel : submitLabel}
        </Button>
      )}
    </div>
  );
}
