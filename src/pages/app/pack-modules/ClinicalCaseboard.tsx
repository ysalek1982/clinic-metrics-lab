import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import type { AlertSummary, NutritionPlanSummary } from "@/services/clinicalService";
import type { EncounterSnapshot, SaasPatientSnapshot } from "@/types/saas";
import { MetricGrid, ModuleListCard } from "./shared";

export function ClinicalCaseboard({
  patients,
  alerts,
  screenings,
  plans,
  encounters,
}: {
  patients: SaasPatientSnapshot[];
  alerts: AlertSummary[];
  screenings: Array<{ id: string; score: number; level: string }>;
  plans: NutritionPlanSummary[];
  encounters: EncounterSnapshot[];
}) {
  const highRisk = patients.filter((patient) => patient.risk === "high" || patient.risk === "critical");
  const trend = [
    { month: "Ene", alerts: 12, screenings: 94, plans: 84 },
    { month: "Feb", alerts: 16, screenings: 122, plans: 97 },
    { month: "Mar", alerts: 18, screenings: 146, plans: 118 },
    { month: "Abr", alerts: 22, screenings: 168, plans: 142 },
  ];

  return (
    <>
      <MetricGrid
        items={[
          { label: "Pacientes activos", value: patients.length, hint: "cartera operativa del pack" },
          { label: "Riesgo alto / crítico", value: highRisk.length, hint: "requiere intervención" },
          { label: "Screenings", value: screenings.length, hint: "esta semana" },
          { label: "Planes activos", value: plans.length, hint: "prescripción vigente" },
        ]}
      />

      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="panel p-5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tendencia institucional</div>
          <h3 className="mt-1 text-[16px] font-medium">Riesgo, screening y planes</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface-raised))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Area type="monotone" dataKey="screenings" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" />
                <Area type="monotone" dataKey="plans" stroke="hsl(var(--pack-pediatric))" fill="hsl(var(--pack-pediatric) / 0.12)" />
                <Line type="monotone" dataKey="alerts" stroke="hsl(var(--risk-high))" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <ModuleListCard
            title="Pacientes críticos"
            subtitle="Intervención inmediata"
            rows={highRisk.slice(0, 5).map((patient) => ({
              title: patient.fullName,
              body: `${patient.diagnosisSummary} · ${patient.location}`,
              badge: patient.risk,
            }))}
          />
          <ModuleListCard
            title="Episodios abiertos"
            subtitle="Caseboard clínico"
            rows={encounters.slice(0, 5).map((encounter) => ({
              title: encounter.title,
              body: `${encounter.type} · ${encounter.openedAt}`,
              badge: encounter.status,
            }))}
          />
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Alertas activas</div>
          <h3 className="mt-1 text-[16px] font-medium">Motor de reglas clínicas</h3>
        </div>
        <div className="divide-y divide-border">
          {alerts.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
              No hay alertas clínicas abiertas para este pack.
            </div>
          )}
          {alerts.slice(0, 6).map((alert) => (
            <div key={alert.id} className="flex items-center gap-3 px-5 py-4">
              <RiskDot level={alert.severity} />
              <div className="flex-1">
                <div className="text-[13px] font-medium">{alert.patientName}</div>
                <div className="text-[12px] text-muted-foreground">{alert.message}</div>
              </div>
              <RiskBadge level={alert.severity} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
