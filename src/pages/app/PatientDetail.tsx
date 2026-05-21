import { Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, ArrowLeft, Brain, CalendarClock, Dumbbell, FileText, FlaskConical, History, MessageSquare, Ruler, ShieldAlert, Stethoscope } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/common/RiskBadge";
import { PackPill } from "@/components/common/PackPill";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { usePatientAppointments } from "@/hooks/useAppointments";
import { usePatientMessageThreads } from "@/hooks/useMessages";
import { usePediatricGrowthRecords } from "@/hooks/usePediatricGrowth";
import { usePatientWeeklyMenus } from "@/hooks/useWeeklyMenus";
import { useEnteralCare, useParenteralCare } from "@/hooks/useSpecialtyModules";
import { useCopilotContext } from "@/hooks/useCopilotContext";
import { usePatientDetail, useTenantAlerts, useTenantReferences } from "@/hooks/useClinicalData";
import { formatDateTime as formatDateTimeDisplay, formatNumber as formatDisplayNumber } from "@/lib/formatters";
import { presentStatus } from "@/lib/presentation";
import { resolveViewSource } from "@/lib/view-source";

function metricLabel(key: string) {
  const labels: Record<string, string> = {
    screeningScore: "Puntaje screening",
    anthropometryQuality: "Calidad antropometría",
  };

  return labels[key] ?? key;
}

function encounterTypeLabel(value: string) {
  const labels: Record<string, string> = {
    admission: "Internación",
    outpatient: "Consulta externa",
    sports_season: "Temporada deportiva",
    teleconsult: "Teleconsulta",
    follow_up: "Seguimiento",
  };

  return labels[value] ?? value;
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    open: "Abierto",
    closed: "Cerrado",
    on_hold: "En pausa",
    active: "Activo",
    draft: "Borrador",
    paused: "Pausado",
    completed: "Completado",
    monitoring: "En seguimiento",
    critical: "Crítico",
    discharged: "Alta",
    low: "Bajo",
    moderate: "Moderado",
    high: "Alto",
  };

  return labels[value] ?? value;
}

function appointmentTypeLabel(value: string) {
  const labels: Record<string, string> = {
    consulta: "Consulta",
    antropometria: "Antropometría",
    educacion: "Educación",
    telemedicina: "Telemedicina",
    seguimiento: "Seguimiento",
    control_labs: "Control de laboratorios",
    otro: "Otro",
  };

  return labels[value] ?? value;
}

function appointmentStatusLabel(value: string) {
  const labels: Record<string, string> = {
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No asistió",
  };

  return labels[value] ?? statusLabel(value);
}

function messageThreadStatusLabel(value: string) {
  const labels: Record<string, string> = {
    open: "Abierto",
    pending: "Pendiente",
    closed: "Cerrado",
  };

  return labels[value] ?? statusLabel(value);
}

function messagePriorityLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Baja",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente",
  };

  return labels[value] ?? value;
}

function formatDateTime(value: string | null | undefined) {
  return formatDateTimeDisplay(value, "--");
}

function dateOnly(value: string | null | undefined) {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : "--";
}

export default function PatientDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { hasPermission } = useAuthorization();
  const { data: detailResult, isLoading } = usePatientDetail(id);
  const { data: referenceResult } = useTenantReferences();
  const { data: alertResult } = useTenantAlerts();
  const { data: patientAppointments = [] } = usePatientAppointments(id ?? null);
  const { data: patientMessages = [] } = usePatientMessageThreads(id ?? null);
  const { data: pediatricGrowthResult } = usePediatricGrowthRecords(id ?? null);
  const { data: patientWeeklyMenus = [] } = usePatientWeeklyMenus(id ?? null);
  const { data: enteralResult } = useEnteralCare();
  const { data: parenteralResult } = useParenteralCare();
  const { context: copilotContext } = useCopilotContext();
  const detailData = detailResult?.data;
  const patient = detailData?.patient ?? null;
  const contacts = detailData?.contacts ?? [];
  const encounters = detailData?.encounters ?? [];
  const screenings = detailData?.screenings ?? [];
  const anthropometrySessions = detailData?.anthropometrySessions ?? [];
  const notes = detailData?.notes ?? [];
  const assessments = detailData?.assessments ?? [];
  const plans = detailData?.plans ?? [];
  const labOrders = detailData?.labOrders ?? [];
  const labResults = detailData?.labResults ?? [];
  const ccorpAssessments = detailData?.ccorpLevel1Assessments ?? [];
  const sportsProfiles = detailData?.sportsProfiles ?? [];
  const sportsAssessments = detailData?.sportsAssessments ?? [];
  const pediatricGrowthRecords = pediatricGrowthResult?.records ?? [];
  const patientEnteralPlans = (enteralResult?.data ?? []).filter((plan) => plan.patientId === id);
  const activeEnteralPlan = patientEnteralPlans.find((plan) => plan.status !== "closed") ?? patientEnteralPlans[0] ?? null;
  const patientParenteralPlans = (parenteralResult?.data ?? []).filter((plan) => plan.patientId === id);
  const activeParenteralPlan = patientParenteralPlans.find((plan) => plan.status !== "closed") ?? patientParenteralPlans[0] ?? null;
  const patientAlerts = (alertResult?.data ?? []).filter((alert) => alert.patientId === id);
  const organizations = Array.isArray(referenceResult?.data?.organizations) ? referenceResult.data.organizations : [];
  const services = organizations.flatMap((organization) => (Array.isArray(organization?.services) ? organization.services : []));
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [detailResult?.source, referenceResult?.source],
  });
  const longitudinal = buildLongitudinalSeries(screenings, anthropometrySessions);
  const latestAnthropometryDate = dateOnly(anthropometrySessions[0]?.measuredAt);
  const latestCcorpDate = dateOnly(ccorpAssessments[0]?.measuredAt);
  const latestSportsAssessment = sportsAssessments[0] ?? null;
  const activeSportsProfile = sportsProfiles[0] ?? null;
  const latestLabOrder = labOrders[0] ?? null;
  const latestLabResults = latestLabOrder ? labResults.filter((result) => result.labOrderId === latestLabOrder.id) : [];
  const latestPediatricRecord = pediatricGrowthRecords.at(-1) ?? null;
  const latestPediatricResult =
    latestPediatricRecord?.results.find((result) => result.indicatorCode === "bmi_for_age") ??
    latestPediatricRecord?.results[0] ??
    null;
  const upcomingAppointment = patientAppointments
    .filter((appointment) => appointment.status === "scheduled" && new Date(appointment.startsAt).getTime() >= Date.now())
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0] ?? null;
  const timelineItems = [
    ...screenings.map((screening) => ({
      key: screening.id,
      type: "Screening",
      title: screening.templateName,
      detail: `Puntaje ${screening.score} · ${statusLabel(screening.level)}`,
      time: screening.performedAt,
    })),
    ...assessments.map((assessment) => ({
      key: assessment.id,
      type: "Evaluación",
      title: "Evaluación clínica",
      detail: statusLabel(assessment.status),
      time: assessment.createdAt,
    })),
    ...plans.map((plan) => ({
      key: plan.id,
      type: "Plan",
      title: `Plan ${plan.type}`,
      detail: statusLabel(plan.status),
      time: plan.createdAt,
    })),
    ...labOrders.map((order) => ({
      key: order.id,
      type: "Laboratorio",
      title: `Orden ${order.provider ?? "laboratorio"}`,
      detail:
        order.criticalCount > 0
          ? `${order.criticalCount} marcadores críticos`
          : order.outOfRangeCount > 0
            ? `${order.outOfRangeCount} marcadores fuera de rango`
            : "Marcadores dentro de rango",
      time: order.resultedAt ?? order.orderedAt,
    })),
    ...ccorpAssessments.map((assessment) => ({
      key: assessment.id,
      type: "CCORP Nivel 1",
      title: "Composición corporal y somatotipo",
      detail: `% graso ${formatOptionalNumber(assessment.durninBodyFatPercent)} · somatotipo ${formatSomatotype(assessment.endomorphy, assessment.mesomorphy, assessment.ectomorphy)}`,
      time: assessment.measuredAt,
    })),
    ...sportsAssessments.map((assessment) => ({
      key: assessment.id,
      type: "Deportivo",
      title: "Evaluación deportiva",
      detail:
        formatSomatotype(assessment.endomorphy, assessment.mesomorphy, assessment.ectomorphy) === "--"
          ? "Datos antropométricos insuficientes para somatotipo"
          : `Somatotipo ${formatSomatotype(assessment.endomorphy, assessment.mesomorphy, assessment.ectomorphy)}`,
      time: assessment.measuredAt,
    })),
    ...patientAppointments.map((appointment) => ({
      key: appointment.id,
      type: "Agenda",
      title: appointmentTypeLabel(appointment.appointmentType),
      detail: `${appointmentStatusLabel(appointment.status)} · ${appointment.location ?? "Sin ubicación"}`,
      time: appointment.startsAt,
    })),
    ...patientMessages.map((thread) => ({
      key: thread.id,
      type: "Mensaje",
      title: thread.subject,
      detail: `${messageThreadStatusLabel(thread.status)} - ${thread.lastMessagePreview ?? "Sin mensajes"}`,
      time: thread.lastMessageAt ?? thread.createdAt,
    })),
    ...patientWeeklyMenus.map((menu) => ({
      key: menu.id,
      type: "Menú semanal",
      title: menu.name ?? "Menú semanal",
      detail: `${statusLabel(menu.status)} - ${formatOptionalNumber(menu.nutrition.weekly.kcal)} kcal semanales`,
      time: menu.updatedAt,
    })),
    ...patientEnteralPlans.map((plan) => ({
      key: plan.id,
      type: "Soporte enteral",
      title: plan.formulaName,
      detail: `${statusLabel(plan.status)} - ${plan.metrics.volumeDeliveredPct ?? "--"}% volumen entregado`,
      time: plan.latestLog?.loggedAt ?? plan.createdAt,
    })),
    ...patientParenteralPlans.map((plan) => ({
      key: plan.id,
      type: "Soporte parenteral",
      title: plan.prescribingPhysician ?? "Plan parenteral",
      detail: `${statusLabel(plan.status)} - ${plan.totalVolumeMl ?? "--"} ml`,
      time: plan.latestLog?.loggedAt ?? plan.createdAt,
    })),
    ...pediatricGrowthRecords.map((record) => {
      const result = record.results.find((item) => item.indicatorCode === "bmi_for_age") ?? record.results[0] ?? null;
      return {
        key: record.id,
        type: "Pediatría",
        title: "Control pediátrico",
        detail: `${record.ageMonths} meses - ${pediatricClassificationLabel(result?.classification)}`,
        time: record.measuredAt,
      };
    }),
    ...notes.map((note) => ({
      key: note.id,
      type: "Nota",
      title: note.title,
      detail: note.body,
      time: note.createdAt,
    })),
  ].sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime());
  const patientCopilotFindings = copilotContext.operationalFindings
    .filter((finding) => finding.patientId === id)
    .slice(0, 3);
  const patientCopilotTasks = copilotContext.tasks.filter((task) => task.patientId === id).slice(0, 3);
  const patientCopilotTimeline = copilotContext.timeline.filter((event) => event.patientId === id).slice(0, 3);
  const canUseCopilot = hasPermission("ai.assist");

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">Cargando expediente clínico...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-[13px] text-muted-foreground">
          No se encontró el paciente solicitado en el tenant activo.
        </div>
      </div>
    );
  }

  const patientName = patient.fullName?.trim() || "Paciente sin nombre";
  const patientInitials = patientName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("") || "PT";
  const patientActivePacks = patient.activePacks ?? [];
  const patientLastEvaluationAt = patient.lastEvaluationAt ?? dateOnly(assessments[0]?.createdAt);
  const patientNextFollowUpAt = patient.nextFollowUpAt ?? "--";

  return (
    <div>
      <div className="border-b border-border bg-surface/30">
        <div className="px-6 py-3">
          <Link
            to="/app/patients"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Pacientes
          </Link>
        </div>
        <div className="flex items-start justify-between gap-6 px-6 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/20 to-primary-glow/10 text-lg font-serif italic">
              {patientInitials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight">{patientName}</h1>
                {patient && <RiskBadge level={patient.risk} />}
                <SourceStateBadge source={viewSource} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] font-mono text-muted-foreground">
                <span>{patient.mrn ?? "--"}</span>
                <span>·</span>
                <span>
                  {patient.ageLabel ?? "--"} · {patient.sex === "male" ? "Masculino" : patient.sex === "female" ? "Femenino" : "Otro"}
                </span>
                <span>·</span>
                <span>{patient.location ?? "--"}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {patientActivePacks.map((packId) => (
                  <PackPill key={packId} pack={packId} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[12px]">
              Programar seguimiento
            </Button>
            <Button asChild size="sm" className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary">
              <Link to="/app/evaluations/new">Nueva evaluación</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {viewSource === "fallback" && (
          <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
            La ficha mantiene la experiencia longitudinal mientras se completan mediciones, notas o planes reales del paciente.
          </div>
        )}

        <div className="panel p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <h2 className="text-[15px] font-medium">Asistente contextual</h2>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Hallazgos locales derivados de alertas, laboratorios, planes y agenda. No genera diagnóstico ni tratamiento.
              </p>
            </div>
            {canUseCopilot ? (
              <Button asChild variant="outline" size="sm" className="h-8 text-[12px]">
                <Link to={`/app/copilot?patient=${patient.id}`}>Abrir en Copilot</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-[12px]" disabled title="Requiere permiso ai.assist">
                Abrir en Copilot
              </Button>
            )}
          </div>
          {!canUseCopilot ? (
            <div className="mt-4 rounded-md border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground">
              Tu rol no habilita el asistente contextual para este expediente. Solicita el permiso ai.assist para ver hallazgos, tareas y timeline del Copilot.
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {patientCopilotFindings.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground md:col-span-3">
                    No hay hallazgos contextuales priorizados para este paciente en los datos visibles.
                  </div>
                ) : (
                  patientCopilotFindings.map((finding) => (
                    <Link key={finding.id} to={finding.href} className="rounded-md border border-border bg-surface-raised/35 p-3 hover:border-primary/30">
                      <div className="text-[12px] font-medium">{finding.title}</div>
                      <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{finding.description}</div>
                    </Link>
                  ))
                )}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-surface-raised/25 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tareas operativas</div>
                  <div className="mt-2 space-y-2">
                    {patientCopilotTasks.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground">Sin tareas operativas activas para este paciente.</p>
                    ) : (
                      patientCopilotTasks.map((task) => (
                        <Link key={task.id} to={task.actionHref} className="block rounded-md border border-border bg-background/30 px-3 py-2 hover:border-primary/30">
                          <div className="text-[12px] font-medium">{task.title}</div>
                          <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{task.description}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-surface-raised/25 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Timeline operativo</div>
                  <div className="mt-2 space-y-2">
                    {patientCopilotTimeline.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground">Sin eventos operativos recientes.</p>
                    ) : (
                      patientCopilotTimeline.map((event) => (
                        <Link key={event.id} to={event.href} className="block rounded-md border border-border bg-background/30 px-3 py-2 hover:border-primary/30">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-[12px] font-medium">{event.title}</div>
                            <span className="text-[10px] font-mono uppercase text-muted-foreground">{copilotTimelineTypeLabel(event.type)}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">{formatDateTimeDisplay(event.occurredAt ?? null, "Sin fecha")}</div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <InfoTile label="Servicio" value={services.find((service) => service.id === patient.serviceId)?.name ?? patient.location ?? "Servicio"} />
          <InfoTile label="Pack primario" value={patient.primaryPack ?? "--"} />
          <InfoTile label="Última evaluación" value={patientLastEvaluationAt} />
          <InfoTile label="Próximo seguimiento" value={patientNextFollowUpAt} accent="--primary" />
        </div>

        {contacts.length > 0 && (
          <div className="panel p-4">
            <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Contacto del paciente
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {contacts.map((contact) => (
                <InfoTile
                  key={contact.id}
                  label={contact.type === "phone" ? "Teléfono" : contact.type === "email" ? "Correo" : "Dirección"}
                  value={contact.value}
                />
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="h-9 border border-border bg-surface-raised/40 p-0.5">
            <TabsTrigger value="overview" className="text-[12px] data-[state=active]:bg-background">Resumen</TabsTrigger>
            <TabsTrigger value="episode" className="text-[12px] data-[state=active]:bg-background">Episodio</TabsTrigger>
            <TabsTrigger value="labs" className="text-[12px] data-[state=active]:bg-background">Laboratorios</TabsTrigger>
            <TabsTrigger value="anthropometry" className="text-[12px] data-[state=active]:bg-background">Antropometría</TabsTrigger>
            <TabsTrigger value="sports" className="text-[12px] data-[state=active]:bg-background">Deportivo</TabsTrigger>
            <TabsTrigger value="pediatric" className="text-[12px] data-[state=active]:bg-background">Pediatría</TabsTrigger>
            <TabsTrigger value="messages" className="text-[12px] data-[state=active]:bg-background">Mensajes</TabsTrigger>
            <TabsTrigger value="weekly-menu" className="text-[12px] data-[state=active]:bg-background">Menú</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[12px] data-[state=active]:bg-background">Evolución</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid gap-3 lg:grid-cols-3">
            <div className="panel p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="text-[15px] font-medium">Evolución longitudinal</h3>
              </div>
              <div className="h-[280px]">
                {longitudinal.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-center text-[13px] text-muted-foreground">
                    Aún no hay suficientes datos para graficar evolución.
                  </div>
                ) : (
                <ResponsiveContainer>
                  <AreaChart data={longitudinal} margin={{ left: -20, right: 8 }}>
                    <defs>
                      <linearGradient id="patient-weight" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11, fontFamily: "Geist Mono" }} />
                    <Tooltip
                      formatter={(value, name) => [value, metricLabel(String(name))]}
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="screeningScore" stroke="hsl(var(--risk-high))" fill="hsl(var(--risk-high) / 0.04)" strokeWidth={2} />
                    <Area type="monotone" dataKey="anthropometryQuality" stroke="hsl(var(--primary))" fill="url(#patient-weight)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="panel p-5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Resumen clínico</div>
              <h3 className="mt-1 text-[15px] font-medium">{patient.diagnosisSummary ?? "Sin resumen"}</h3>
              <div className="mt-5 space-y-2">
                {patient && <MiniRule icon={ShieldAlert} label="Riesgo" value={statusLabel(patient.risk)} />}
                {patient && <MiniRule icon={CalendarClock} label="Seguimiento" value={patientNextFollowUpAt} />}
                {patient && <MiniRule icon={Stethoscope} label="Estado" value={statusLabel(patient.status)} />}
                {patient && <MiniRule icon={FileText} label="MRN" value={patient.mrn} />}
              </div>
            </div>

            <div className="panel p-5 lg:col-span-3">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Alertas clínicas del paciente
                  </div>
                  <h3 className="mt-1 text-[15px] font-medium">
                    {patientAlerts.length > 0 ? `${patientAlerts.length} eventos activos o gestionados` : "Sin alertas clínicas visibles"}
                  </h3>
                </div>
              </div>

              {patientAlerts.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-[13px] text-muted-foreground">
                  No hay alertas reales asociadas a este paciente.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {patientAlerts.slice(0, 6).map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-border bg-surface-raised/40 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge level={alert.severity} />
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
                          {presentStatus(alert.status)}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">{presentStatus(alert.type)}</span>
                      </div>
                      <p className="mt-2 text-[12px] text-muted-foreground">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel p-5 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Soporte nutricional hospitalario</div>
                    <h3 className="mt-1 text-[15px] font-medium">
                      {activeEnteralPlan
                        ? `Enteral activo: ${activeEnteralPlan.formulaName}`
                        : activeParenteralPlan
                          ? `Parenteral ${statusLabel(activeParenteralPlan.status)}`
                          : "Sin soporte hospitalario activo"}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                    <Link to="/app/pack/enteral/cockpit">Abrir enteral</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                    <Link to="/app/pack/parenteral">Abrir parenteral</Link>
                  </Button>
                </div>
              </div>

              {patientEnteralPlans.length === 0 && patientParenteralPlans.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-[13px] text-muted-foreground">
                  No hay soporte enteral o parenteral real asociado a este paciente.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-4">
                  <InfoTile label="Enteral" value={activeEnteralPlan ? statusLabel(activeEnteralPlan.status) : "--"} />
                  <InfoTile label="Via enteral" value={activeEnteralPlan?.route ?? "--"} />
                  <InfoTile label="Parenteral" value={activeParenteralPlan ? statusLabel(activeParenteralPlan.status) : "--"} />
                  <InfoTile
                    label="Ultimo monitoreo"
                    value={
                      activeParenteralPlan?.latestLog?.loggedAt
                        ? dateOnly(activeParenteralPlan.latestLog.loggedAt)
                        : dateOnly(activeEnteralPlan?.latestLog?.loggedAt)
                    }
                    accent="--primary"
                  />
                </div>
              )}
            </div>

            <div className="panel p-5 lg:col-span-3">
              <div className="mb-4 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Agenda del paciente</div>
                  <h3 className="mt-1 text-[15px] font-medium">
                    {upcomingAppointment
                      ? `Próxima cita: ${formatDateTime(upcomingAppointment.startsAt)}`
                      : "Sin próximas citas programadas"}
                  </h3>
                </div>
              </div>

              {patientAppointments.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-[13px] text-muted-foreground">
                  No hay citas reales asociadas a este paciente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                        <th className="px-4 py-2.5 text-left font-normal">Tipo</th>
                        <th className="px-4 py-2.5 text-left font-normal">Estado</th>
                        <th className="px-4 py-2.5 text-left font-normal">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {patientAppointments.slice(0, 5).map((appointment) => (
                        <tr key={appointment.id} className="hover:bg-surface-raised/40">
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{formatDateTime(appointment.startsAt)}</td>
                          <td className="px-4 py-3">{appointmentTypeLabel(appointment.appointmentType)}</td>
                          <td className="px-4 py-3">{appointmentStatusLabel(appointment.status)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{appointment.location ?? "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="episode">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Episodios del paciente</div>
                <h3 className="mt-1 text-[15px] font-medium">Casos, consultas y seguimientos</h3>
              </div>
              {encounters.length === 0 ? (
                <p className="px-5 py-8 text-[13px] text-muted-foreground">No hay episodios visibles para este paciente.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Episodio</th>
                        <th className="px-4 py-2.5 text-left font-normal">Tipo</th>
                        <th className="px-4 py-2.5 text-left font-normal">Estado</th>
                        <th className="px-4 py-2.5 text-left font-normal">Apertura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {encounters.map((encounter) => (
                        <Fragment key={encounter.id}>
                          <tr className="hover:bg-surface-raised/40">
                            <td className="px-4 py-3 font-medium">{encounter.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">{encounterTypeLabel(encounter.type)}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase text-primary">
                                {statusLabel(encounter.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{encounter.openedAt}</td>
                          </tr>
                          {encounter.notes && (
                            <tr className="border-t border-border/50 bg-surface-raised/20">
                              <td colSpan={4} className="px-4 pb-3 pt-0 text-[12px] text-muted-foreground">
                                <span className="font-mono text-[10px] uppercase tracking-wider">Notas: </span>
                                {encounter.notes}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="anthropometry">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <h3 className="text-[15px] font-medium">Antropometría avanzada</h3>
                </div>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-4">
                <InfoTile label="Sesiones" value={anthropometrySessions.length} />
                <InfoTile label="CCORP Nivel 1" value={ccorpAssessments.length} />
                <InfoTile label="Última medición" value={latestAnthropometryDate !== "--" ? latestAnthropometryDate : latestCcorpDate} />
                <InfoTile label="Último % graso" value={formatOptionalNumber(ccorpAssessments[0]?.durninBodyFatPercent)} />
              </div>
              {ccorpAssessments.length > 0 && (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                        <th className="px-4 py-2.5 text-left font-normal">% graso</th>
                        <th className="px-4 py-2.5 text-left font-normal">Masa grasa</th>
                        <th className="px-4 py-2.5 text-left font-normal">Masa magra</th>
                        <th className="px-4 py-2.5 text-left font-normal">Somatotipo</th>
                        <th className="px-4 py-2.5 text-right font-normal">Informe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ccorpAssessments.map((assessment) => (
                        <tr key={assessment.id} className="hover:bg-surface-raised/40">
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{dateOnly(assessment.measuredAt)}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(assessment.durninBodyFatPercent)}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(assessment.durninFatMassKg)}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(assessment.durninFatFreeMassKg)}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">{formatSomatotype(assessment.endomorphy, assessment.mesomorphy, assessment.ectomorphy)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                              <Link to={`/app/ccorp-level-1/${assessment.id}`}>Ver informe</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {anthropometrySessions.length > 0 && (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                        <th className="px-4 py-2.5 text-left font-normal">Protocolo</th>
                        <th className="px-4 py-2.5 text-left font-normal">Calidad</th>
                        <th className="px-4 py-2.5 text-left font-normal">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {anthropometrySessions.map((session) => (
                        <tr key={session.id} className="hover:bg-surface-raised/40">
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{dateOnly(session.measuredAt)}</td>
                          <td className="px-4 py-3">{session.protocolId ?? "--"}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">{session.qualityIndex ?? "--"}</td>
                          <td className="px-4 py-3 text-muted-foreground">Registro antropométrico del tenant activo</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sports">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <h3 className="text-[15px] font-medium">Deportivo y somatocarta</h3>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Perfil deportivo, composición corporal y somatotipo real asociado al expediente.
                </p>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-4">
                <InfoTile label="Disciplina" value={activeSportsProfile?.discipline ?? "--"} />
                <InfoTile label="Nivel" value={activeSportsProfile?.category ?? "--"} />
                <InfoTile label="Última evaluación" value={dateOnly(latestSportsAssessment?.measuredAt)} />
                <InfoTile
                  label="Somatotipo"
                  value={formatSomatotype(latestSportsAssessment?.endomorphy, latestSportsAssessment?.mesomorphy, latestSportsAssessment?.ectomorphy)}
                  accent={latestSportsAssessment?.endomorphy != null ? "--primary" : "--risk-moderate"}
                />
              </div>

              {sportsProfiles.length === 0 && sportsAssessments.length === 0 ? (
                <div className="border-t border-border px-5 py-8 text-[13px] text-muted-foreground">
                  No hay perfil deportivo ni evaluaciones reales asociadas a este paciente.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 border-t border-border p-5 md:grid-cols-3">
                    <div className="rounded-lg border border-border bg-surface-raised/40 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Objetivo deportivo</div>
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        {activeSportsProfile?.objective ?? "Objetivo deportivo pendiente de registrar."}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-surface-raised/40 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Composición corporal</div>
                      <div className="mt-2 space-y-1 text-[12px] text-muted-foreground">
                        <div>% grasa: {formatOptionalNumber(latestSportsAssessment?.fatPct)}</div>
                        <div>Masa magra: {formatOptionalNumber(latestSportsAssessment?.leanMassKg)} kg</div>
                        <div>Músculo esquelético: {formatOptionalNumber(latestSportsAssessment?.skeletalMuscleKg)} kg</div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface-raised/40 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Somatocarta</div>
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        {latestSportsAssessment &&
                        formatSomatotype(latestSportsAssessment.endomorphy, latestSportsAssessment.mesomorphy, latestSportsAssessment.ectomorphy) !== "--"
                          ? "Somatotipo disponible desde datos antropométricos reales."
                          : "Datos antropométricos insuficientes para graficar somatocarta."}
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-3 h-7 px-2 text-[11px]">
                        <Link to="/app/pack/sport/somatocarta">Abrir somatocarta</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border-t border-border">
                    <table className="w-full tabular text-[13px]">
                      <thead>
                        <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                          <th className="px-4 py-2.5 text-left font-normal">% graso</th>
                          <th className="px-4 py-2.5 text-left font-normal">Masa magra</th>
                          <th className="px-4 py-2.5 text-left font-normal">Músculo</th>
                          <th className="px-4 py-2.5 text-left font-normal">Somatotipo</th>
                          <th className="px-4 py-2.5 text-left font-normal">Fuente</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sportsAssessments.map((assessment) => (
                          <tr key={assessment.id} className="hover:bg-surface-raised/40">
                            <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{dateOnly(assessment.measuredAt)}</td>
                            <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(assessment.fatPct)}</td>
                            <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(assessment.leanMassKg)}</td>
                            <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(assessment.skeletalMuscleKg)}</td>
                            <td className="px-4 py-3 text-[11px] font-mono">
                              {formatSomatotype(assessment.endomorphy, assessment.mesomorphy, assessment.ectomorphy)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {assessment.notes?.includes("Fuente CCORP Nivel 1") ? "CCORP Nivel 1" : "Manual sin somatotipo"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="labs">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <h3 className="text-[15px] font-medium">Laboratorios</h3>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Órdenes y marcadores reales asociados al expediente del paciente.
                </p>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-4">
                <InfoTile label="Órdenes" value={labOrders.length} />
                <InfoTile label="Última orden" value={latestLabOrder?.resultedAt ? dateOnly(latestLabOrder.resultedAt) : dateOnly(latestLabOrder?.orderedAt)} />
                <InfoTile label="Fuera de rango" value={latestLabOrder?.outOfRangeCount ?? 0} />
                <InfoTile label="Críticos" value={latestLabOrder?.criticalCount ?? 0} accent="--risk-critical" />
              </div>
              {latestLabResults.length === 0 ? (
                <div className="border-t border-border px-5 py-8 text-[13px] text-muted-foreground">
                  No hay resultados de laboratorio registrados para este paciente.
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Marcador</th>
                        <th className="px-4 py-2.5 text-left font-normal">Categoría</th>
                        <th className="px-4 py-2.5 text-left font-normal">Actual</th>
                        <th className="px-4 py-2.5 text-left font-normal">Rango</th>
                        <th className="px-4 py-2.5 text-left font-normal">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {latestLabResults.map((result) => (
                        <tr key={result.id} className="hover:bg-surface-raised/40">
                          <td className="px-4 py-3 font-medium">{result.markerName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{result.category}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">
                            {result.value ?? "--"} {result.unit}
                          </td>
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
                            {result.referenceLow ?? "--"} - {result.referenceHigh ?? "--"} {result.unit}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase text-primary">
                              {statusLabel(result.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pediatric">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <h3 className="text-[15px] font-medium">Curvas pediátricas</h3>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Controles pediátricos reales asociados al expediente. Los z-scores solo se muestran si hay referencia activa completa.
                </p>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-4">
                <InfoTile label="Controles" value={pediatricGrowthRecords.length} />
                <InfoTile label="Último control" value={dateOnly(latestPediatricRecord?.measuredAt)} />
                <InfoTile label="Edad control" value={latestPediatricRecord ? `${latestPediatricRecord.ageMonths} meses` : "--"} />
                <InfoTile
                  label="Clasificación"
                  value={pediatricClassificationLabel(latestPediatricResult?.classification)}
                  accent={latestPediatricResult?.classification === "referencia_incompleta" ? "--risk-moderate" : "--primary"}
                />
              </div>

              {pediatricGrowthRecords.length === 0 ? (
                <div className="border-t border-border px-5 py-8 text-[13px] text-muted-foreground">
                  No hay mediciones pediátricas reales asociadas a este paciente.
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                        <th className="px-4 py-2.5 text-left font-normal">Edad</th>
                        <th className="px-4 py-2.5 text-left font-normal">Peso</th>
                        <th className="px-4 py-2.5 text-left font-normal">Talla/longitud</th>
                        <th className="px-4 py-2.5 text-left font-normal">IMC</th>
                        <th className="px-4 py-2.5 text-left font-normal">Resultado</th>
                        <th className="px-4 py-2.5 text-right font-normal">Curva</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pediatricGrowthRecords.map((record) => {
                        const result = record.results.find((item) => item.indicatorCode === "bmi_for_age") ?? record.results[0] ?? null;
                        return (
                          <tr key={record.id} className="hover:bg-surface-raised/40">
                            <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{dateOnly(record.measuredAt)}</td>
                            <td className="px-4 py-3 text-[11px] font-mono">{record.ageMonths} meses</td>
                            <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(record.measurement.weightKg)} kg</td>
                            <td className="px-4 py-3 text-[11px] font-mono">
                              {formatOptionalNumber(record.measurement.heightCm ?? record.measurement.lengthCm)} cm
                            </td>
                            <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(calculatePatientBmi(record.measurement.weightKg, record.measurement.heightCm ?? record.measurement.lengthCm))}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase text-primary">
                                {pediatricClassificationLabel(result?.classification)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                                <Link to={`/app/pediatric-curves?patient=${patient.id}`}>Ver curvas</Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-[15px] font-medium">Mensajes clínicos</h3>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Hilos reales asociados al expediente del paciente.
                </p>
              </div>
              {patientMessages.length === 0 ? (
                <div className="border-t border-border px-5 py-8 text-[13px] text-muted-foreground">
                  No hay mensajes reales asociados a este paciente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Último movimiento</th>
                        <th className="px-4 py-2.5 text-left font-normal">Asunto</th>
                        <th className="px-4 py-2.5 text-left font-normal">Estado</th>
                        <th className="px-4 py-2.5 text-left font-normal">Prioridad</th>
                        <th className="px-4 py-2.5 text-right font-normal">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {patientMessages.map((thread) => (
                        <tr key={thread.id} className="hover:bg-surface-raised/40">
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{formatDateTime(thread.lastMessageAt ?? thread.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{thread.subject}</div>
                            <div className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">{thread.lastMessagePreview ?? "Sin mensajes"}</div>
                          </td>
                          <td className="px-4 py-3">{messageThreadStatusLabel(thread.status)}</td>
                          <td className="px-4 py-3">{messagePriorityLabel(thread.priority)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                              <Link to={`/app/messages?thread=${thread.id}`}>Abrir hilo</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="weekly-menu">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <h3 className="text-[15px] font-medium">Menú semanal</h3>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Planificación alimentaria real asociada al expediente del paciente.
                </p>
              </div>
              {patientWeeklyMenus.length === 0 ? (
                <div className="border-t border-border px-5 py-8 text-[13px] text-muted-foreground">
                  No hay menús semanales reales asociados a este paciente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Semana</th>
                        <th className="px-4 py-2.5 text-left font-normal">Menú</th>
                        <th className="px-4 py-2.5 text-left font-normal">Estado</th>
                        <th className="px-4 py-2.5 text-left font-normal">Kcal semanales</th>
                        <th className="px-4 py-2.5 text-left font-normal">Proteína</th>
                        <th className="px-4 py-2.5 text-right font-normal">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {patientWeeklyMenus.map((menu) => (
                        <tr key={menu.id} className="hover:bg-surface-raised/40">
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{menu.weekStart}</td>
                          <td className="px-4 py-3 font-medium">{menu.name ?? "Menú semanal"}</td>
                          <td className="px-4 py-3">{statusLabel(menu.status)}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(menu.nutrition.weekly.kcal)}</td>
                          <td className="px-4 py-3 text-[11px] font-mono">{formatOptionalNumber(menu.nutrition.weekly.proteinG)} g</td>
                          <td className="px-4 py-3 text-right">
                            <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                              <Link to="/app/weekly-menu">Abrir menú</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Timeline clínico</div>
                <h3 className="mt-1 text-[15px] font-medium">Eventos longitudinales</h3>
              </div>
              {timelineItems.length === 0 ? (
                <div className="px-5 py-8 text-[13px] text-muted-foreground">No hay eventos clínicos registrados para este paciente.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full tabular text-[13px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-normal">Fecha</th>
                        <th className="px-4 py-2.5 text-left font-normal">Tipo</th>
                        <th className="px-4 py-2.5 text-left font-normal">Registro</th>
                        <th className="px-4 py-2.5 text-left font-normal">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {timelineItems.map((item) => (
                        <tr key={item.key} className="hover:bg-surface-raised/40">
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{item.time}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase text-primary">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{item.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function buildLongitudinalSeries(
  screenings: Array<{ performedAt: string; score: number }>,
  anthropometrySessions: Array<{ measuredAt: string; qualityIndex: number | null }>,
) {
  const bucketMap = new Map<string, { date: string; screeningScore: number; anthropometryQuality: number }>();

  screenings.forEach((screening) => {
    const date = new Date(screening.performedAt);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    bucketMap.set(key, {
      ...(bucketMap.get(key) ?? { date: date.toLocaleDateString("es-BO", { month: "short", day: "2-digit" }) }),
      screeningScore: screening.score,
    });
  });

  anthropometrySessions.forEach((session) => {
    const date = new Date(session.measuredAt);
    if (Number.isNaN(date.getTime()) || session.qualityIndex === null) return;
    const key = date.toISOString().slice(0, 10);
    bucketMap.set(key, {
      ...(bucketMap.get(key) ?? { date: date.toLocaleDateString("es-BO", { month: "short", day: "2-digit" }) }),
      anthropometryQuality: session.qualityIndex,
    });
  });

  return [...bucketMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value);
}

function InfoTile({ label, value, accent }: { label: string; value: string | number | null | undefined; accent?: string }) {
  return (
    <div className="panel p-3.5" style={accent ? { boxShadow: `inset 3px 0 0 hsl(var(${accent}) / 0.6)` } : undefined}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 tabular text-[14px] font-medium capitalize">{value ?? "--"}</div>
    </div>
  );
}

function MiniRule({ icon: Icon, label, value }: { icon: typeof ShieldAlert; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-surface-raised/50 px-3 py-2">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <span className="text-[10px] font-mono uppercase">{value ?? "--"}</span>
    </div>
  );
}

function formatOptionalNumber(value: number | null | undefined) {
  return formatDisplayNumber(value, { fallback: "--", maximumFractionDigits: 2 });
}

function calculatePatientBmi(weightKg: number | null | undefined, heightCm: number | null | undefined) {
  if (typeof weightKg !== "number" || typeof heightCm !== "number" || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function pediatricClassificationLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    esperado: "Normal",
    normal: "Normal",
    bajo: "Bajo",
    muy_bajo: "Muy bajo",
    alto: "Alto",
    muy_alto: "Muy alto",
    bajo_peso_severo: "Bajo peso severo",
    bajo_peso: "Bajo peso",
    peso_alto_para_edad: "Peso alto para la edad",
    talla_baja_severa: "Talla baja severa",
    talla_baja: "Talla baja",
    talla_alta: "Talla alta",
    delgadez_severa: "Delgadez severa",
    delgadez: "Delgadez",
    riesgo_sobrepeso: "Riesgo de sobrepeso",
    sobrepeso: "Sobrepeso",
    obesidad: "Obesidad",
    microcefalia_severa: "Microcefalia severa",
    microcefalia: "Microcefalia",
    macrocefalia: "Macrocefalia",
    macrocefalia_severa: "Macrocefalia severa",
    interpretacion_pendiente: "Interpretación pendiente",
    referencia_incompleta: "Referencia incompleta",
    sin_referencia: "Sin referencia",
  };

  return value ? labels[value] ?? presentStatus(value) : "--";
}

function copilotTimelineTypeLabel(type: string) {
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

function formatSomatotype(endo: number | null | undefined, meso: number | null | undefined, ecto: number | null | undefined) {
  return typeof endo === "number" && typeof meso === "number" && typeof ecto === "number"
    ? `${formatDisplayNumber(endo, { fallback: "--" })}-${formatDisplayNumber(meso, { fallback: "--" })}-${formatDisplayNumber(ecto, { fallback: "--" })}`
    : "--";
}
