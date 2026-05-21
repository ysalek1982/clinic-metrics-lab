import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import type { AlertSummary, NutritionPlanSummary } from "@/services/clinicalService";
import type { PackId } from "@/types/domain";
import type { SaasPatientSnapshot } from "@/types/saas";
import { MetricGrid } from "./shared";

export function PackHub({
  pack,
  patients,
  alerts,
  screenings,
  plans,
  modules,
}: {
  pack: { id: PackId; name: string; description: string };
  patients: SaasPatientSnapshot[];
  alerts: AlertSummary[];
  screenings: Array<{ id: string }>;
  plans: NutritionPlanSummary[];
  modules: Array<{ slug: string; name: string; description: string }>;
}) {
  return (
    <>
      <MetricGrid
        items={[
          { label: "Pacientes activos", value: patients.length, hint: "casos visibles del pack" },
          { label: "Alertas", value: alerts.length, hint: "motor clínico del tenant" },
          { label: "Screenings", value: screenings.length, hint: "seguimiento operativo" },
          { label: "Planes", value: plans.length, hint: "prescripciones activas" },
        ]}
      />

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Módulos activos</div>
          <h3 className="mt-1 text-[16px] font-medium">Experiencia modular del pack</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {modules.map((module) => (
              <Link
                key={module.slug}
                to={`/app/pack/${pack.id}/${module.slug}`}
                className="rounded-lg border border-border bg-surface-raised/30 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium">{module.name}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{module.description}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pacientes priorizados</div>
            <h3 className="mt-1 text-[16px] font-medium">Vista rápida del pack</h3>
          </div>
          <div className="divide-y divide-border">
            {patients.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                No hay pacientes visibles para este pack.
              </div>
            )}
            {patients.slice(0, 6).map((patient) => (
              <Link
                key={patient.id}
                to={`/app/patients/${patient.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-raised/30"
              >
                <RiskDot level={patient.risk} />
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{patient.fullName}</div>
                  <div className="text-[11px] text-muted-foreground">{patient.diagnosisSummary}</div>
                </div>
                <RiskBadge level={patient.risk} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
