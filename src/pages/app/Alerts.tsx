import { BellOff, CheckCheck, ChevronRight, Stethoscope, VolumeX } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleState } from "@/components/common/ModuleState";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { useAcknowledgeAlert, useBulkAcknowledgeAlerts, useTenantAlerts } from "@/hooks/useClinicalData";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { formatDateTime, formatInteger } from "@/lib/formatters";
import { presentStatus } from "@/lib/presentation";
import { resolveViewSource } from "@/lib/view-source";
import type { AlertSummary } from "@/services/clinicalService";

type AlertAction = Exclude<AlertSummary["status"], "active">;

const STATUS_BADGE_CLASS: Record<AlertSummary["status"], string> = {
  active: "border-primary/40 bg-primary/10 text-primary",
  reviewed: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  resolved: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  silenced: "border-slate-400/40 bg-slate-400/10 text-slate-200",
  attended: "border-amber-400/40 bg-amber-400/10 text-amber-200",
};

export default function Alerts() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { activeTenant, activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { data: alertResult, isLoading, isError, error } = useTenantAlerts();
  const acknowledgeAlert = useAcknowledgeAlert();
  const bulkAcknowledgeAlerts = useBulkAcknowledgeAlerts();
  const baseAlerts = useMemo(() => alertResult?.data ?? [], [alertResult?.data]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const selectedAlert = useMemo(
    () => baseAlerts.find((alert) => alert.id === selectedAlertId) ?? null,
    [baseAlerts, selectedAlertId],
  );
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [alertResult?.source],
  });
  const activeAlerts = baseAlerts.filter((alert) => alert.status === "active" || alert.status === "attended");
  const canManageAlerts = hasPermission("alerts.manage");
  const actionPending = acknowledgeAlert.isPending || bulkAcknowledgeAlerts.isPending;

  async function handleAlertAction(alert: AlertSummary, status: AlertAction) {
    if (!activeTenantId) return;
    const silencedUntil =
      status === "silenced" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    await acknowledgeAlert.mutateAsync({
      tenantId: activeTenantId,
      alertId: alert.id,
      patientId: alert.patientId,
      status,
      sourceType: alert.sourceType,
      sourceId: alert.sourceId,
      priority: alert.severity,
      silencedUntil,
      note:
        status === "silenced"
          ? "Silenciada desde el centro de alertas por 24 horas."
          : status === "attended"
            ? "Atendida desde el centro de alertas."
            : null,
      metadata: { type: alert.type, created_at: alert.createdAt },
    });
  }

  async function handleAttend(alert: AlertSummary) {
    await handleAlertAction(alert, "attended");
    navigate(`/app/patients/${alert.patientId}`);
    setSelectedAlertId(null);
  }

  async function handleBulkReviewed() {
    if (!activeTenantId || activeAlerts.length === 0) return;
    await bulkAcknowledgeAlerts.mutateAsync({
      tenantId: activeTenantId,
      status: "reviewed",
      alerts: activeAlerts.map((alert) => ({
        alertId: alert.id,
        patientId: alert.patientId,
        sourceType: alert.sourceType,
        sourceId: alert.sourceId,
        priority: alert.severity,
      })),
    });
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{`Centro de alertas · ${activeTenant?.slug ?? "tiempo real"}`}</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Alertas activas"
        subtitle={`${formatInteger(baseAlerts.length, "0")} alertas clínicas del tenant`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => void handleBulkReviewed()}
            title={canManageAlerts ? undefined : "Sin permiso para gestionar alertas"}
            disabled={!canManageAlerts || actionPending || activeAlerts.length === 0}
          >
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            Marcar activas como revisadas
          </Button>
        }
      />

      <div className="space-y-2 p-6">
        {viewSource === "fallback" && (
          <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
            DEMO: el centro de alertas visual solo se muestra sin sesión autenticada.
          </div>
        )}

        {isLoading && (
          <ModuleState tone="loading" title="Cargando alertas..." description="Consultando alertas reales del tenant activo." />
        )}

        {isError && (
          <ModuleState
            tone="error"
            title="No se pudieron cargar las alertas."
            description={error instanceof Error ? error.message : "Revisa permisos o conexión con Supabase."}
          />
        )}

        {baseAlerts.map((alert) => (
          <div key={alert.id} className="panel flex items-start gap-4 p-4">
            <RiskDot level={alert.severity} className="mt-2" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-medium">{alert.patientName}</span>
                {alert.ward && <span className="text-[11px] font-mono text-muted-foreground">{alert.ward}</span>}
                <RiskBadge level={alert.severity} />
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{presentStatus(alert.type)}</span>
                <StatusBadge status={alert.status} />
              </div>

              <p className="mt-1 text-[13px] text-muted-foreground">{alert.message}</p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <span className="tabular text-[10px] font-mono text-muted-foreground">
                {formatDateTime(alert.createdAt)}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => void handleAlertAction(alert, "reviewed")}
                title={canManageAlerts ? undefined : "Sin permiso para gestionar alertas"}
                disabled={!canManageAlerts || actionPending || alert.status === "reviewed" || alert.status === "resolved"}
              >
                <BellOff className="mr-1 h-3 w-3" />
                Revisar
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => void handleAlertAction(alert, "silenced")}
                title={canManageAlerts ? undefined : "Sin permiso para gestionar alertas"}
                disabled={!canManageAlerts || actionPending || alert.status === "silenced" || alert.status === "resolved"}
              >
                <VolumeX className="mr-1 h-3 w-3" />
                Silenciar
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setSelectedAlertId(alert.id)}
                title={canManageAlerts ? undefined : "Sin permiso para gestionar alertas"}
                disabled={!canManageAlerts || actionPending || alert.status === "resolved"}
              >
                <Stethoscope className="mr-1 h-3 w-3" />
                Atender
              </Button>

              <Button
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => void handleAlertAction(alert, "resolved")}
                title={canManageAlerts ? undefined : "Sin permiso para gestionar alertas"}
                disabled={!canManageAlerts || actionPending || alert.status === "resolved"}
              >
                Resolver
              </Button>
            </div>
          </div>
        ))}

        {!isLoading && !isError && baseAlerts.length === 0 && (
          <ModuleState tone="empty" title="Sin alertas clínicas." description="No hay alertas clínicas para el tenant activo." />
        )}
      </div>

      <Sheet open={Boolean(selectedAlert)} onOpenChange={(open) => !open && setSelectedAlertId(null)}>
        <SheetContent side="right" className="w-[560px] overflow-y-auto sm:max-w-[560px]">
          <SheetHeader>
            <SheetTitle>Atender alerta</SheetTitle>
            <SheetDescription>
              Revisa el evento y navega directo al caso sin perder el contexto del centro de alertas.
            </SheetDescription>
          </SheetHeader>

          {selectedAlert && (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg border border-border bg-surface-raised/30 p-4">
                <div className="flex items-center gap-2">
                  <RiskDot level={selectedAlert.severity} />
                  <div className="text-[16px] font-semibold">{selectedAlert.patientName}</div>
                  <RiskBadge level={selectedAlert.severity} />
                  <StatusBadge status={selectedAlert.status} />
                </div>
                <div className="mt-2 text-[11px] font-mono uppercase text-muted-foreground">
                  {presentStatus(selectedAlert.type)} {selectedAlert.ward ? `· ${selectedAlert.ward}` : ""}
                </div>
                <p className="mt-3 text-[13px] text-muted-foreground">{selectedAlert.message}</p>
              </div>

              <div className="grid gap-3">
                <ActionTile
                  title="Abrir ficha del paciente"
                  description="Ir al resumen longitudinal del caso y revisar timeline, laboratorios, screening, antropometría y planes."
                />
                <ActionTile
                  title="Registrar atención"
                  description="La acción Atender persiste estado, usuario y auditoría antes de navegar al expediente."
                />
                <ActionTile
                  title="Resolver evento"
                  description="Usa Resolver cuando el evento clínico ya fue gestionado por el equipo."
                />
              </div>
            </div>
          )}

          <SheetFooter className="mt-6">
            {selectedAlert && (
              <>
                <Button variant="outline" onClick={() => void handleAlertAction(selectedAlert, "reviewed")} disabled={!canManageAlerts || actionPending}>
                  <BellOff className="mr-1.5 h-3.5 w-3.5" />
                  Revisar
                </Button>
                <Button onClick={() => void handleAttend(selectedAlert)} disabled={!canManageAlerts || actionPending}>
                  Atender caso
                  <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status }: { status: AlertSummary["status"] }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${STATUS_BADGE_CLASS[status]}`}>
      {presentStatus(status)}
    </span>
  );
}

function ActionTile({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="text-[13px] font-medium">{title}</div>
      <div className="mt-1 text-[12px] text-muted-foreground">{description}</div>
    </div>
  );
}
