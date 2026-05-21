import { ArrowUpRight, Activity, Brain, ClipboardCheck, ShieldAlert, Users } from "lucide-react";
import {
  Area as ChartArea,
  AreaChart as ChartAreaChart,
  CartesianGrid as ChartGrid,
  ResponsiveContainer as ChartContainer,
  Tooltip as ChartTooltip,
  XAxis as ChartXAxis,
  YAxis as ChartYAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { MODULE_REGISTRY } from "@/config/moduleRegistry";
import { getProfileModules, suggestOperationalProfile } from "@/config/operationalProfiles";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCopilotContext } from "@/hooks/useCopilotContext";
import {
  useTenantAlerts,
  useTenantEncounters,
  useTenantNutritionPlans,
  useTenantPatients,
  useTenantScreenings,
} from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { formatInteger, formatPercent } from "@/lib/formatters";
import { resolveViewSource } from "@/lib/view-source";

function metricLabel(key: string) {
  const labels: Record<string, string> = {
    evaluations: "Evaluaciones",
    plans: "Planes",
    risk: "Riesgo",
  };

  return labels[key] ?? key;
}

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const { hasPermission } = useAuthorization();
  const { activePlan, activeTenant, enabledPacks, source } = useTenantRuntime();
  const { data: patientResult } = useTenantPatients();
  const { data: encounterResult } = useTenantEncounters();
  const { data: alertResult } = useTenantAlerts();
  const { data: screeningResult } = useTenantScreenings();
  const { data: planResult } = useTenantNutritionPlans();
  const { context: copilotContext } = useCopilotContext();

  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [
      source,
      patientResult?.source,
      encounterResult?.source,
      alertResult?.source,
      screeningResult?.source,
      planResult?.source,
    ],
  });

  if (!activeTenant) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">
          Selecciona un tenant para cargar el panel institucional.
        </div>
      </div>
    );
  }

  const patients = patientResult?.data ?? [];
  const encounters = encounterResult?.data ?? [];
  const alerts = alertResult?.data ?? [];
  const screenings = screeningResult?.data ?? [];
  const plans = planResult?.data ?? [];
  const canReadReports = hasPermission("reports.read", "reports.generate", "reports.manage");
  const canUseCopilot = hasPermission("ai.assist");
  const suggestedOperationalProfile = suggestOperationalProfile({
    enabledPacks,
    hasHospitalData: alerts.some((alert) => ["enteral", "parenteral", "labs"].includes(alert.sourceType ?? "")),
    hasNutritionOperationsData: plans.length > 0,
    isAdmin: hasPermission("users.manage") || hasPermission("organization.manage") || hasPermission("audit_logs.read"),
  });
  const suggestedProfileModules = getProfileModules(suggestedOperationalProfile, MODULE_REGISTRY).slice(0, 6);
  const highRisk = patients.filter((patient) => patient.risk === "high" || patient.risk === "critical");
  const openEncounters = encounters.filter((encounter) => encounter.status === "open");
  const evaluationsThisWeek = encounters.filter((encounter) => {
    const date = new Date(encounter.openedAt);
    return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length + screenings.filter((screening) => {
    const date = new Date(screening.date);
    return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const activePlanCount = plans.filter((plan) => plan.status === "active").length;
  const adherence = plans.length > 0 ? Math.round((activePlanCount / plans.length) * 100) : null;
  const trendData = buildTenantTrend({
    encounters: encounters.map((encounter) => encounter.openedAt),
    plans: plans.map((plan) => plan.createdAt),
    screenings: screenings.map((screening) => screening.date),
    alerts: alerts.map((alert) => alert.createdAt),
  });

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex items-center gap-2 flex-wrap">
            <span>{`${activeTenant?.branding?.commercialName ?? activeTenant?.name ?? "Tenant activo"} · ${activePlan?.name ?? activeTenant?.planId ?? "Plan activo"}`}</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Panel ejecutivo institucional"
        subtitle="Visión consolidada del estado nutricional, alertas activas y carga clínica."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-[12px]">
              Últimos 30 días
            </Button>
            {canReadReports ? (
              <Button asChild size="sm" className="h-8 text-[12px] gradient-primary text-primary-foreground border-0">
                <Link to="/app/reports">Generar informe</Link>
              </Button>
            ) : (
              <Button size="sm" className="h-8 text-[12px]" disabled title="Requiere permiso reports.read">
                Generar informe
              </Button>
            )}
            {canUseCopilot ? (
              <Button asChild variant="outline" size="sm" className="h-8 text-[12px]">
                <Link to="/app/copilot">
                  Copilot <Brain className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-[12px]" disabled title="Requiere permiso ai.assist">
                Copilot <Brain className="ml-1 h-3 w-3" />
              </Button>
            )}
          </>
        }
      />

      <div className="p-6 space-y-6">
        {viewSource === "fallback" && (
          <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
            Parte del tenant está usando fallback visual porque no todas las consultas remotas devolvieron datos operativos.
          </div>
        )}

        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Perfil operativo sugerido</div>
              <h3 className="mt-1 text-[16px] font-medium">{suggestedOperationalProfile.label}</h3>
              <p className="mt-1 max-w-3xl text-[12px] leading-5 text-muted-foreground">
                {suggestedOperationalProfile.description} La seleccion es visual/local hasta tener persistencia tenant-scoped.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-[12px]">
              <Link to="/app/module-settings">Configurar perfiles</Link>
            </Button>
          </div>
          <div className="grid gap-2 border-t border-border p-4 sm:grid-cols-2 xl:grid-cols-6">
            {suggestedProfileModules.map((module) => (
              <Link
                key={module.id}
                to={module.route ?? "/app/modules"}
                className="rounded-md border border-border bg-surface-raised/35 px-3 py-2 text-[12px] transition-colors hover:border-primary/30 hover:bg-surface-raised/60"
              >
                <div className="font-medium text-foreground">{module.label}</div>
                <div className="mt-1 truncate text-[10px] text-muted-foreground">{module.permission ?? "Sin permiso especifico"}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Pacientes activos"
            value={formatInteger(patients.length, "0")}
            hint={`${formatInteger(patients.length, "0")} visibles por tenant`}
            icon={<Users className="w-3 h-3" />}
          />
          <KpiCard
            label="Riesgo alto / crítico"
            value={formatInteger(highRisk.length, "0")}
            hint={`${formatInteger(alerts.length, "0")} alertas derivadas`}
            accent="--risk-high"
            icon={<ShieldAlert className="w-3 h-3" />}
          />
          <KpiCard
            label="Evaluaciones esta semana"
            value={formatInteger(evaluationsThisWeek, "0")}
            hint="antropometría + clínicas"
            accent="--pack-clinical"
            icon={<Activity className="w-3 h-3" />}
          />
          <KpiCard
            label="Adherencia media plan"
            value={adherence === null ? "No calculado" : formatPercent(adherence)}
            hint={plans.length > 0 ? `${formatInteger(activePlanCount, "0")} planes activos` : "sin planes activos"}
            accent="--pack-sport"
            icon={<ClipboardCheck className="w-3 h-3" />}
          />
        </div>

        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Copilot clínico
              </div>
              <h3 className="mt-0.5 text-[15px] font-medium">Top pendientes del tenant</h3>
            </div>
            {canUseCopilot ? (
              <Button asChild variant="ghost" size="sm" className="text-[12px] text-muted-foreground hover:text-foreground">
                <Link to="/app/copilot">
                  Abrir Copilot <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-[12px] text-muted-foreground" disabled title="Requiere permiso ai.assist">
                Abrir Copilot
              </Button>
            )}
          </div>
          <div className="grid gap-3 p-5 lg:grid-cols-3">
            {!canUseCopilot ? (
              <div className="rounded-md border border-dashed border-border px-4 py-6 text-[13px] text-muted-foreground lg:col-span-3">
                No tienes permiso para usar el Copilot clínico en este tenant.
              </div>
            ) : copilotContext.todayAttention.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-6 text-[13px] text-muted-foreground lg:col-span-3">
                No hay tareas contextuales derivadas de alertas, laboratorios, agenda o planes visibles.
              </div>
            ) : (
              copilotContext.todayAttention.slice(0, 3).map((task) => (
                <Link
                  key={task.id}
                  to={task.actionHref}
                  className="rounded-md border border-border bg-surface-raised/35 p-4 transition-colors hover:border-primary/30 hover:bg-surface-raised/60"
                >
                  <div className="flex items-center gap-2">
                    <RiskBadge level={task.severity === "info" ? "low" : task.severity} />
                    <span className="truncate text-[13px] font-medium">{task.patientName ?? task.module}</span>
                  </div>
                  <div className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">
                    {task.title} · {task.actionLabel}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="panel p-5 xl:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Tendencia institucional
                </div>
                <h3 className="mt-0.5 text-[15px] font-medium">Riesgo, evaluaciones y planes activos</h3>
              </div>
            </div>

            <div className="h-[270px]">
              {trendData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-center text-[13px] text-muted-foreground">
                  Aún no hay suficientes datos para graficar evolución institucional.
                </div>
              ) : (
              <ChartContainer>
                <ChartAreaChart data={trendData} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="dash-eval" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <ChartGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <ChartXAxis dataKey="d" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                  <ChartYAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                  <ChartTooltip
                    formatter={(value, name) => [value, metricLabel(String(name))]}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <ChartArea type="monotone" dataKey="evaluations" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#dash-eval)" />
                  <ChartArea type="monotone" dataKey="plans" stroke="hsl(var(--pack-sport))" strokeWidth={2} fill="hsl(var(--pack-sport) / 0.05)" />
                  <ChartArea type="monotone" dataKey="risk" stroke="hsl(var(--risk-high))" strokeWidth={2} fill="hsl(var(--risk-high) / 0.04)" />
                </ChartAreaChart>
              </ChartContainer>
              )}
            </div>
          </div>

          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Índice nutricional global</div>
            <h3 className="mt-0.5 text-[15px] font-medium">NRS institucional</h3>
            <div className="mt-7 flex justify-center">
              <div className="relative h-44 w-44 rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) 0 72%, hsl(var(--surface-raised)) 72% 100%)` }}>
                <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-card">
                  <div className="text-3xl font-light text-primary">72</div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">de 100</div>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
              <StatusLine label="Cobertura" value={formatPercent(94)} />
              <StatusLine label="Reevaluación" value={formatPercent(88)} />
              <StatusLine label="Adherencia" value={adherence === null ? "No calculado" : formatPercent(adherence)} />
              <StatusLine label="Tiempo medio" value="11 min" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="panel p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Distribución por pack</div>
            <h3 className="mt-1 text-[15px] font-medium">Casos activos · {patients.length}</h3>
            <div className="mt-5 space-y-3">
              {["clinical", "pediatric", "gineco", "enteral", "sport"].map((packId) => {
                const count = patients.filter((patient) => (patient.activePacks ?? []).includes(packId as typeof patient.activePacks[number])).length;
                const width = patients.length ? Math.max(8, Math.round((count / patients.length) * 100)) : 0;
                return (
                  <div key={packId} className="grid grid-cols-[90px_1fr_36px] items-center gap-3">
                    <div className="text-[11px] font-mono text-muted-foreground">{packId}</div>
                    <div className="h-4 rounded bg-surface-raised">
                      <div className="h-4 rounded bg-primary/70" style={{ width: `${width}%` }} />
                    </div>
                    <div className="text-right text-[11px] font-mono">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Pacientes priorizados
                </div>
                <h3 className="mt-0.5 text-[15px] font-medium">Riesgo y seguimiento del tenant activo</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-[12px] text-muted-foreground hover:text-foreground">
                <Link to="/app/patients">
                  Ver todos <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {patients.slice(0, 5).map((patient) => (
                <Link
                  key={patient.id}
                  to={`/app/patients/${patient.id}`}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-raised/50"
                >
                  <RiskDot level={patient.risk} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium">{patient.fullName}</span>
                      <RiskBadge level={patient.risk} />
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{patient.diagnosisSummary}</div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">{patient.nextFollowUpAt}</div>
                </Link>
              ))}
              {patients.length === 0 && (
                <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                  Todavía no hay pacientes operativos visibles para el tenant activo.
                </div>
              )}
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Alertas derivadas</div>
              <h3 className="mt-0.5 text-[15px] font-medium">Pendientes del tenant activo</h3>
            </div>
            <div className="divide-y divide-border">
              {alerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={alert.severity} />
                    <span className="text-[13px] font-medium">{alert.patientName}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{alert.message}</div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                  No hay alertas abiertas derivadas de screenings, seguimiento o antropometría.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildTenantTrend(input: {
  encounters: string[];
  plans: string[];
  screenings: string[];
  alerts: string[];
}) {
  const bucketMap = new Map<string, { d: string; evaluations: number; plans: number; risk: number }>();

  function add(dateValue: string | null | undefined, key: "evaluations" | "plans" | "risk") {
    if (!dateValue) return;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return;
    const bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = bucketMap.get(bucketKey) ?? {
      d: date.toLocaleDateString("es-BO", { month: "short" }),
      evaluations: 0,
      plans: 0,
      risk: 0,
    };
    current[key] += 1;
    bucketMap.set(bucketKey, current);
  }

  input.encounters.forEach((date) => add(date, "evaluations"));
  input.screenings.forEach((date) => add(date, "evaluations"));
  input.plans.forEach((date) => add(date, "plans"));
  input.alerts.forEach((date) => add(date, "risk"));

  return [...bucketMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([, value]) => value)
    .filter((value) => value.evaluations > 0 || value.plans > 0 || value.risk > 0);
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-md bg-surface-raised/50 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-[10px] uppercase">{value}</span>
    </div>
  );
}
