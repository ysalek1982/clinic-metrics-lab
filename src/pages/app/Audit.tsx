import { Database, FileClock, LockKeyhole, ShieldCheck } from "lucide-react";
import { ModuleState } from "@/components/common/ModuleState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTenantAudit } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { formatDateTime, formatInteger } from "@/lib/formatters";

export default function Audit() {
  const { activeTenant } = useTenantRuntime();
  const { data: auditResult, isLoading, isError, error } = useTenantAudit();
  const events = auditResult?.data ?? [];
  const source = auditResult?.source ?? "supabase";

  return (
    <div>
      <PageHeader
        meta={`Compliance foundation · ${source}`}
        title="Auditoría y trazabilidad"
        subtitle="Historial de accesos, cambios sensibles, versiones, exportaciones y eventos IA."
        actions={
          <Button size="sm" variant="outline" className="h-8" disabled title="Próximamente">
            Exportar auditoría · Próximamente
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-3">
          <AuditKpi icon={LockKeyhole} label="Tenant aislado" value={activeTenant?.slug ?? "--"} />
          <AuditKpi icon={ShieldCheck} label="Estado RLS" value="habilitado" />
          <AuditKpi icon={Database} label="Eventos visibles" value={formatInteger(events.length, "0")} />
          <AuditKpi icon={FileClock} label="Retención" value="7 años" />
        </div>

        <div className="panel overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Timeline</div>
            <h3 className="text-[15px] font-medium mt-0.5">Eventos sensibles recientes</h3>
          </div>
          <div className="divide-y divide-border">
            {isLoading && (
              <div className="p-5">
                <ModuleState tone="loading" title="Cargando auditoría..." description="Consultando eventos reales del tenant activo." />
              </div>
            )}
            {isError && (
              <div className="p-5">
                <ModuleState
                  tone="error"
                  title="No se pudo cargar auditoría."
                  description={error instanceof Error ? error.message : "Revisa permisos o conexión con Supabase."}
                />
              </div>
            )}
            {!isLoading && events.length === 0 && (
              <div className="p-5">
                <ModuleState
                  tone="empty"
                  title="Sin eventos visibles."
                  description="Todavía no hay eventos visibles para el tenant activo."
                />
              </div>
            )}
            {events.map((event) => (
              <div key={event.id} className="px-5 py-4 flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-primary">{event.event_type}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">{event.entity_type}</span>
                    {event.entity_id && <span className="text-[11px] text-muted-foreground">{event.entity_id}</span>}
                  </div>
                  <div className="text-[13px] mt-1">
                    {typeof event.after_data === "object" && event.after_data
                      ? JSON.stringify(event.after_data).slice(0, 180)
                      : "Cambio registrado sin payload visible."}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{event.actor_user_id ?? "system"}</div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground tabular">{formatDateTime(event.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditKpi({ icon: Icon, label, value }: { icon: typeof LockKeyhole; label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {label}
      </div>
      <div className="text-[15px] font-semibold mt-3">{value}</div>
    </div>
  );
}
