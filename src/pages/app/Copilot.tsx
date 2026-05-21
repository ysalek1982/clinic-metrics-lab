import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CalendarDays,
  FileText,
  FlaskConical,
  ListChecks,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/common/KpiCard";
import { ModuleState } from "@/components/common/ModuleState";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge } from "@/components/common/RiskBadge";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answerCopilotQuery } from "@/domain/copilot/copilotQuery";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCopilotContext } from "@/hooks/useCopilotContext";
import { formatDateTime, formatInteger } from "@/lib/formatters";
import type { RiskLevel } from "@/types/domain";

function severityTone(severity: string) {
  if (severity === "critical") return "border-risk-critical/30 bg-risk-critical/10 text-risk-critical";
  if (severity === "high") return "border-risk-high/30 bg-risk-high/10 text-risk-high";
  if (severity === "moderate") return "border-risk-moderate/30 bg-risk-moderate/10 text-risk-moderate";
  if (severity === "low") return "border-risk-low/30 bg-risk-low/10 text-risk-low";
  return "border-border bg-surface-raised text-muted-foreground";
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "low" || severity === "moderate" || severity === "high" || severity === "critical") {
    return <RiskBadge level={severity as RiskLevel} />;
  }

  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-mono uppercase ${severityTone(severity)}`}>
      Informativo
    </span>
  );
}

function taskStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Abierta",
    due_today: "Hoy",
    overdue: "Vencida",
    informational: "Informativa",
  };

  return labels[status] ?? status;
}

function timelineTypeLabel(type: string) {
  const labels: Record<string, string> = {
    alert: "Alerta",
    lab: "Lab",
    appointment: "Agenda",
    plan: "Plan",
    report: "Reporte",
    enteral: "Enteral",
    parenteral: "Parenteral",
    sports: "Deportivo",
    pediatric: "Pediatría",
    message: "Mensaje",
    patient: "Paciente",
  };

  return labels[type] ?? type;
}

function quickLinkIcon(module: string) {
  if (module === "alerts") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (module === "labs") return <FlaskConical className="h-3.5 w-3.5" />;
  if (module === "agenda") return <CalendarDays className="h-3.5 w-3.5" />;
  if (module === "plans") return <ListChecks className="h-3.5 w-3.5" />;
  if (module === "reports") return <FileText className="h-3.5 w-3.5" />;
  if (module === "enteral" || module === "parenteral") return <FileText className="h-3.5 w-3.5" />;
  if (module === "notes") return <MessageSquare className="h-3.5 w-3.5" />;
  if (module === "messages") return <MessageSquare className="h-3.5 w-3.5" />;
  if (module === "pediatric") return <FileText className="h-3.5 w-3.5" />;
  if (module === "sports") return <Sparkles className="h-3.5 w-3.5" />;
  return <Users className="h-3.5 w-3.5" />;
}

export default function Copilot() {
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get("patient");
  const { hasPermission } = useAuthorization();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(queryPatientId);
  const [activeFilter, setActiveFilter] = useState("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [query, setQuery] = useState("");
  const [localAnswer, setLocalAnswer] = useState("");
  const {
    activeTenant,
    activeTenantId,
    context,
    enteralCount,
    parenteralCount,
    sportsCount,
    isDemoMode,
    isLoading,
    isError,
    error,
    refetch,
  } = useCopilotContext(selectedPatientId ?? queryPatientId);

  useEffect(() => {
    if (queryPatientId) {
      setSelectedPatientId(queryPatientId);
    }
  }, [queryPatientId]);

  const effectivePatientId = selectedPatientId ?? context.priorities[0]?.patientId ?? context.patientSummaries[0]?.patientId ?? null;
  const selectedPriority = useMemo(
    () => context.priorities.find((priority) => priority.patientId === effectivePatientId) ?? null,
    [context.priorities, effectivePatientId],
  );
  const selectedSummary = useMemo(
    () => context.patientSummaries.find((patient) => patient.patientId === effectivePatientId) ?? null,
    [context.patientSummaries, effectivePatientId],
  );
  const selectedFindings = useMemo(
    () =>
      [
        ...(context.selectedPatientContext?.findings ?? []),
        ...(context.selectedPatientContext?.missingData ?? []),
        ...(context.selectedPatientContext?.suggestedActions ?? []),
      ].slice(0, 5),
    [context.selectedPatientContext],
  );
  const selectedTasks = useMemo(
    () => (context.selectedPatientContext?.tasks ?? context.tasks.filter((task) => task.patientId === effectivePatientId)).slice(0, 5),
    [context.selectedPatientContext?.tasks, context.tasks, effectivePatientId],
  );
  const selectedTimeline = useMemo(
    () => (context.selectedPatientContext?.timeline ?? context.timeline.filter((event) => event.patientId === effectivePatientId)).slice(0, 5),
    [context.selectedPatientContext?.timeline, context.timeline, effectivePatientId],
  );
  const selectedPatientName = selectedPriority?.patientName ?? selectedSummary?.patientName ?? null;
  const selectedPatientHref = selectedPriority?.href ?? selectedSummary?.href ?? (effectivePatientId ? `/app/patients/${effectivePatientId}` : null);
  const hasSelectedContext = Boolean(selectedPatientName && selectedPatientHref);
  const filterOptions = [
    { id: "all", label: "Todos" },
    { id: "high", label: "Alta prioridad" },
    { id: "labs", label: "Labs" },
    { id: "alerts", label: "Alertas" },
    { id: "follow_up", label: "Seguimiento" },
    { id: "support", label: "Soporte nutricional" },
  ];
  const findingsForFilter = useMemo(() => {
    return context.operationalFindings.filter((finding) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "high") return finding.severity === "high" || finding.severity === "critical";
      if (activeFilter === "labs") return finding.module === "labs";
      if (activeFilter === "alerts") return finding.module === "alerts";
      if (activeFilter === "follow_up") return finding.module === "agenda";
      if (activeFilter === "support") return finding.module === "enteral" || finding.module === "parenteral" || finding.module === "plans";
      return true;
    });
  }, [activeFilter, context.operationalFindings]);
  const visiblePriorities = useMemo(() => {
    const search = patientSearch.trim().toLowerCase();
    return context.priorities.filter((priority) => {
      const patientFindings = context.operationalFindings.filter((finding) => finding.patientId === priority.patientId);
      const matchesSearch = !search || priority.patientName.toLowerCase().includes(search);
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "high" && (priority.severity === "high" || priority.severity === "critical")) ||
        (activeFilter === "labs" && patientFindings.some((finding) => finding.module === "labs")) ||
        (activeFilter === "alerts" && patientFindings.some((finding) => finding.module === "alerts")) ||
        (activeFilter === "follow_up" && patientFindings.some((finding) => finding.module === "agenda")) ||
        (activeFilter === "support" && patientFindings.some((finding) => ["enteral", "parenteral", "plans"].includes(finding.module)));
      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, context.operationalFindings, context.priorities, patientSearch]);

  function handleLocalQuery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLocalAnswer(
      answerCopilotQuery(trimmed, {
        patientName: selectedPatientName,
        priorities: selectedPriority ? [selectedPriority] : context.priorities,
        findings: selectedFindings.length > 0 ? selectedFindings : context.operationalFindings,
        tasks: selectedTasks.length > 0 ? selectedTasks : context.tasks,
        timeline: selectedTimeline.length > 0 ? selectedTimeline : context.timeline,
        missingData: context.selectedPatientContext?.missingData ?? context.missingData,
        risks: context.selectedPatientContext?.risks ?? context.risks,
      }),
    );
  }

  if (!activeTenantId || !activeTenant) {
    return (
      <div className="p-6">
        <ModuleState
          tone="warning"
          title="No hay organización activa"
          description="Selecciona una organización activa para construir el contexto del Copilot clínico con datos reales."
        />
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <div className="p-6">
        <ModuleState
          tone="warning"
          title="Copilot clínico no disponible en demo"
          description="El asistente contextual solo opera con sesión autenticada, tenant activo y datos reales protegidos por RLS."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <ModuleState tone="loading" title="Cargando Copilot clínico" description="Consolidando pacientes, alertas, laboratorios, agenda y módulos activos." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ModuleState
          tone="error"
          title="No se pudo cargar el Copilot clínico"
          description={error instanceof Error ? error.message : "Alguna fuente de datos no respondió correctamente."}
          action={{ label: "Reintentar", onClick: () => void refetch() }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{activeTenant?.branding?.commercialName ?? activeTenant?.name ?? "Tenant activo"}</span>
            <SourceStateBadge source="real" />
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase text-primary">
              Reglas locales
            </span>
          </div>
        }
        title="Copilot clínico"
        subtitle="Asistente contextual basado en datos reales del tenant. No usa IA generativa ni emite diagnósticos."
        actions={
          <Button asChild variant="outline" size="sm" className="h-8 text-[12px]">
            <Link to="/app/audit">Ver auditoría</Link>
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        <ModuleState
          tone="warning"
          eyebrow="Modo asistente contextual"
          title="Asistente contextual, sin IA generativa"
          description="Esta vista resume datos reales y aplica reglas locales conservadoras. No genera diagnóstico, pronóstico, tratamiento ni dosificación."
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard
            label="Prioridades"
            value={formatInteger(context.overview.priorityCount, "0")}
            unit=""
            hint="pacientes con señales"
            accent="--risk-high"
            icon={<ShieldAlert className="h-3 w-3" />}
            sparkline={null}
          />
          <KpiCard
            label="Hallazgos"
            value={formatInteger(context.overview.findingCount, "0")}
            unit=""
            hint="reglas locales"
            accent="--primary"
            icon={<ListChecks className="h-3 w-3" />}
            sparkline={null}
          />
          <KpiCard
            label="Tareas"
            value={formatInteger(context.overview.taskCount, "0")}
            unit=""
            hint={`${formatInteger(context.taskSummary.overdue, "0")} vencidas`}
            accent="--risk-moderate"
            icon={<ListChecks className="h-3 w-3" />}
            sparkline={null}
          />
          <KpiCard
            label="Hoy"
            value={formatInteger(context.overview.todayAttentionCount, "0")}
            unit=""
            hint="requiere atención"
            accent="--risk-critical"
            icon={<CalendarDays className="h-3 w-3" />}
            sparkline={null}
          />
          <KpiCard
            label="Soporte hospitalario"
            value={formatInteger(enteralCount + parenteralCount, "0")}
            unit=""
            hint={`${formatInteger(enteralCount, "0")} enteral · ${formatInteger(parenteralCount, "0")} parenteral`}
            accent="--pack-enteral"
            icon={<FileText className="h-3 w-3" />}
            sparkline={null}
          />
          <KpiCard
            label="Deportivo"
            value={formatInteger(sportsCount, "0")}
            unit=""
            hint="perfiles con datos visibles"
            accent="--pack-sport"
            icon={<Sparkles className="h-3 w-3" />}
            sparkline={null}
          />
        </div>

        {context.isEmpty && !hasSelectedContext ? (
          <ModuleState
            tone="empty"
            title="No hay señales contextuales para priorizar"
            description="El Copilot no encontró alertas, laboratorios fuera de rango, citas próximas ni pendientes estructurales en los datos visibles."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[280px_1fr_320px]">
            <aside className="panel overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pacientes prioritarios</div>
                <h2 className="mt-1 text-[15px] font-medium">Atención sugerida</h2>
              </div>
              <div className="space-y-3 border-b border-border px-4 py-3">
                <Input
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                  placeholder="Buscar paciente"
                  aria-label="Buscar paciente priorizado"
                  className="h-8 text-[12px]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveFilter(option.id)}
                      className={`rounded-full border px-2 py-1 text-[10px] font-mono uppercase transition-colors ${
                        activeFilter === option.id
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border bg-surface-raised/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-border">
                {visiblePriorities.length === 0 ? (
                  <div className="p-4 text-[13px] text-muted-foreground">No hay pacientes priorizados para el filtro actual.</div>
                ) : (
                  visiblePriorities.map((priority) => (
                    <button
                      key={priority.patientId}
                      type="button"
                      onClick={() => setSelectedPatientId(priority.patientId)}
                      className={`block w-full px-4 py-3 text-left transition-colors hover:bg-surface-raised/60 ${
                        effectivePatientId === priority.patientId ? "bg-surface-raised/70" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-medium">{priority.patientName}</span>
                        <SeverityBadge severity={priority.severity} />
                      </div>
                      <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {priority.reasons.slice(0, 2).join(" · ")}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <main className="space-y-4">
              <section className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Hoy requiere atención</div>
                    <h2 className="mt-1 text-[18px] font-semibold">Tareas operativas priorizadas</h2>
                  </div>
                  <span className="rounded-full border border-border bg-surface-raised/40 px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground">
                    {formatInteger(context.todayAttention.length, "0")} pendientes
                  </span>
                </div>
                {context.todayAttention.length === 0 ? (
                  <div className="mt-5 rounded-md border border-dashed border-border px-4 py-6 text-[13px] text-muted-foreground">
                    No hay señales operativas para hoy.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {context.todayAttention.slice(0, 6).map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </section>

              <section className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Resumen operativo</div>
                    <h2 className="mt-1 text-[18px] font-semibold">Qué requiere atención</h2>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {formatDateTime(context.generatedAt, "No registrado")}
                  </span>
                </div>
                {findingsForFilter.length === 0 ? (
                  <div className="mt-5 rounded-md border border-dashed border-border px-4 py-6 text-[13px] text-muted-foreground">
                    No hay hallazgos operativos generados por reglas locales para el filtro actual.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {findingsForFilter.slice(0, 6).map((finding) => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))}
                  </div>
                )}
              </section>

              <section className="panel p-5">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h2 className="text-[15px] font-medium">Consulta contextual</h2>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Escribe una pregunta operativa. La respuesta se limita a datos visibles y reglas locales.
                </p>
                <form onSubmit={handleLocalQuery} className="mt-4 flex gap-2">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Preguntar sobre este paciente"
                    aria-label="Preguntar sobre este paciente"
                  />
                  <Button type="submit" disabled={!query.trim()}>
                    Responder
                  </Button>
                </form>
                <div className="mt-4 rounded-md border border-border bg-surface-raised/40 p-4 text-[13px] leading-6 text-muted-foreground">
                  {localAnswer ||
                    "Modo asistente contextual: puedo resumir datos registrados, alertas, laboratorios, agenda y pendientes. La IA generativa no está integrada."}
                </div>
              </section>
            </main>

            <aside className="space-y-4">
              <section className="panel p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Contexto seleccionado</div>
                {selectedPatientName && selectedPatientHref ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-semibold">{selectedPatientName}</h2>
                        {selectedPriority ? <SeverityBadge severity={selectedPriority.severity} /> : selectedSummary ? <RiskBadge level={selectedSummary.risk} /> : null}
                      </div>
                      <div className="mt-1 text-[12px] text-muted-foreground">
                        {selectedPriority
                          ? `Score local ${formatInteger(selectedPriority.score, "0")} · ${selectedPriority.reasons.join(" · ")}`
                          : "Paciente seleccionado desde expediente; sin prioridad activa detectada por reglas locales."}
                      </div>
                    </div>
                    <Button asChild size="sm" className="h-8 w-full text-[12px]">
                      <Link to={selectedPatientHref}>
                        Abrir expediente <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-[13px] text-muted-foreground">No hay paciente seleccionado.</p>
                )}
              </section>

              <section className="panel p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tareas del contexto</div>
                <div className="mt-3 space-y-2">
                  {selectedTasks.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">No hay tareas operativas asociadas al paciente seleccionado.</p>
                  ) : (
                    selectedTasks.map((task) => <TaskLine key={task.id} task={task} />)
                  )}
                </div>
              </section>

              <section className="panel p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Timeline operativo</div>
                <div className="mt-3 space-y-2">
                  {selectedTimeline.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">Sin eventos operativos recientes.</p>
                  ) : (
                    selectedTimeline.map((event) => <TimelineLine key={event.id} event={event} />)
                  )}
                </div>
              </section>

              <section className="panel p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Acciones rápidas</div>
                <div className="mt-3 space-y-2">
                  {context.quickLinks.map((quickLink) => {
                    const lacksPermission = quickLink.requiredPermission ? !hasPermission(quickLink.requiredPermission) : false;
                    const disabled = quickLink.status === "coming_soon" || lacksPermission;
                    const title =
                      quickLink.status === "coming_soon"
                        ? "Próximamente"
                        : lacksPermission
                          ? `Requiere permiso ${quickLink.requiredPermission}`
                          : undefined;
                    const suffix = quickLink.status === "coming_soon" ? "Próximamente" : lacksPermission ? "Sin permiso" : undefined;

                    return (
                      <QuickAction
                        key={quickLink.id}
                        to={quickLink.href}
                        icon={quickLinkIcon(quickLink.module)}
                        label={quickLink.label}
                        disabled={disabled}
                        title={title}
                        suffix={suffix}
                      />
                    );
                  })}
                </div>
              </section>

              <section className="panel p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pendientes de datos</div>
                <div className="mt-3 space-y-2">
                  {context.missingData.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">No hay pendientes estructurales detectados por reglas locales.</p>
                  ) : (
                    context.missingData.slice(0, 4).map((finding) => <FindingLine key={finding.id} finding={finding} />)
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: ReturnType<typeof useCopilotContext>["context"]["tasks"][number] }) {
  return (
    <Link to={task.actionHref} className="rounded-md border border-border bg-surface-raised/35 p-4 transition-colors hover:border-primary/30 hover:bg-surface-raised/60">
      <div className="flex items-center justify-between gap-2">
        <SeverityBadge severity={task.severity} />
        <span className="text-[10px] font-mono uppercase text-muted-foreground">{taskStatusLabel(task.status)}</span>
      </div>
      <h3 className="mt-3 text-[14px] font-medium">{task.title}</h3>
      <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-muted-foreground">{task.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
        {task.patientName && <span className="text-primary">{task.patientName}</span>}
        <span>{task.source}</span>
        {task.dueDate && <span>{formatDateTime(task.dueDate, "Sin fecha")}</span>}
      </div>
    </Link>
  );
}

function FindingCard({ finding }: { finding: ReturnType<typeof useCopilotContext>["context"]["operationalFindings"][number] }) {
  return (
    <Link to={finding.href} className="rounded-md border border-border bg-surface-raised/35 p-4 transition-colors hover:border-primary/30 hover:bg-surface-raised/60">
      <div className="flex items-center justify-between gap-2">
        <SeverityBadge severity={finding.severity} />
        <span className="text-[10px] font-mono uppercase text-muted-foreground">{finding.module}</span>
      </div>
      <h3 className="mt-3 text-[14px] font-medium">{finding.title}</h3>
      <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-muted-foreground">{finding.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
        {finding.patientName && <span className="text-primary">{finding.patientName}</span>}
        <span>{finding.source}</span>
        <span>{finding.actionLabel}</span>
      </div>
    </Link>
  );
}

function FindingLine({ finding }: { finding: ReturnType<typeof useCopilotContext>["context"]["missingData"][number] }) {
  return (
    <Link to={finding.href} className="block rounded-md border border-border bg-surface-raised/30 px-3 py-2 hover:border-primary/30">
      <div className="text-[12px] font-medium">{finding.title}</div>
      <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{finding.description}</div>
    </Link>
  );
}

function TaskLine({ task }: { task: ReturnType<typeof useCopilotContext>["context"]["tasks"][number] }) {
  return (
    <Link to={task.actionHref} className="block rounded-md border border-border bg-surface-raised/30 px-3 py-2 hover:border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[12px] font-medium">{task.title}</div>
        <SeverityBadge severity={task.severity} />
      </div>
      <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
        {taskStatusLabel(task.status)} · {task.actionLabel}
      </div>
    </Link>
  );
}

function TimelineLine({ event }: { event: ReturnType<typeof useCopilotContext>["context"]["timeline"][number] }) {
  return (
    <Link to={event.href} className="block rounded-md border border-border bg-surface-raised/30 px-3 py-2 hover:border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[12px] font-medium">{event.title}</div>
        <span className="text-[10px] font-mono uppercase text-muted-foreground">{timelineTypeLabel(event.type)}</span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(event.occurredAt ?? null, "Sin fecha")}</div>
    </Link>
  );
}

function QuickAction({
  to,
  icon,
  label,
  disabled,
  title,
  suffix,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  title?: string;
  suffix?: string;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" className="h-8 w-full justify-start text-[12px]" disabled title={title}>
        <span className="mr-2">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {suffix && <span className="ml-2 text-[10px] font-mono uppercase text-muted-foreground">{suffix}</span>}
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" size="sm" className="h-8 w-full justify-start text-[12px]">
      <Link to={to}>
        <span className="mr-2">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {suffix && <span className="ml-2 text-[10px] font-mono uppercase text-muted-foreground">{suffix}</span>}
      </Link>
    </Button>
  );
}
