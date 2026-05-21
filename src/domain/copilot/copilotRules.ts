import type { RiskLevel } from "@/types/domain";

export type CopilotSeverity = RiskLevel | "info";

export interface CopilotPatientInput {
  id: string;
  fullName: string;
  risk: RiskLevel;
  diagnosisSummary?: string | null;
  location?: string | null;
  activePacks?: string[];
  nextFollowUpAt?: string | null;
}

export interface CopilotAlertInput {
  id: string;
  patientId: string;
  severity: RiskLevel;
  status: string;
  message: string;
  sourceType?: string | null;
  createdAt?: string | null;
}

export interface CopilotLabInput {
  patientId: string;
  status: "ok" | "out_of_range" | "critical" | "pending";
  outsideCount: number;
  resultedAt?: string | null;
}

export interface CopilotPlanInput {
  patientId: string;
  status: string;
  createdAt?: string | null;
  nextFollowUpAt?: string | null;
}

export interface CopilotAppointmentInput {
  patientId: string;
  startsAt: string;
  status: string;
  appointmentType?: string | null;
}

export interface CopilotEnteralInput {
  patientId: string;
  status: string;
  toleranceStatus?: string | null;
  volumeDeliveredPct?: number | null;
  latestLogAt?: string | null;
  createdAt?: string | null;
}

export interface CopilotParenteralInput {
  patientId: string;
  status: string;
  latestLogAt?: string | null;
}

export interface CopilotSportsProfileInput {
  patientId: string;
  discipline?: string | null;
}

export interface CopilotSportsSnapshotInput {
  patientId: string;
  endomorphy?: number | null;
  mesomorphy?: number | null;
  ectomorphy?: number | null;
  measuredAt?: string | null;
}

export interface CopilotReportInput {
  id: string;
  reportType: string;
  status: string;
  createdAt: string;
}

export interface BuildCopilotRulesInput {
  patients: CopilotPatientInput[];
  alerts: CopilotAlertInput[];
  labs: CopilotLabInput[];
  plans: CopilotPlanInput[];
  appointments: CopilotAppointmentInput[];
  enteralPlans: CopilotEnteralInput[];
  parenteralPlans: CopilotParenteralInput[];
  sportsProfiles: CopilotSportsProfileInput[];
  sportsSnapshots: CopilotSportsSnapshotInput[];
  reports: CopilotReportInput[];
  pediatricReferenceComplete?: boolean;
  now?: Date;
}

export type CopilotFindingType =
  | "active_alert"
  | "critical_lab"
  | "out_of_range_lab"
  | "missing_plan"
  | "upcoming_appointment"
  | "overdue_follow_up"
  | "no_follow_up"
  | "enteral_tolerance"
  | "parenteral_active"
  | "pediatric_reference_incomplete"
  | "sports_insufficient_data"
  | "recent_report"
  | "patient_risk";

export type CopilotFindingModule =
  | "alerts"
  | "labs"
  | "plans"
  | "agenda"
  | "pediatric"
  | "enteral"
  | "parenteral"
  | "sports"
  | "reports"
  | "patients";

export interface CopilotFinding {
  id: string;
  type: CopilotFindingType;
  patientId?: string;
  patientName?: string;
  title: string;
  description: string;
  severity: CopilotSeverity;
  module: CopilotFindingModule;
  source: string;
  actionLabel: string;
  href: string;
  dueDate?: string | null;
  occurredAt?: string | null;
}

export type CopilotTaskType =
  | "alert_review"
  | "lab_review"
  | "plan_missing"
  | "appointment_followup"
  | "enteral_tolerance"
  | "parenteral_monitoring"
  | "pediatric_reference_incomplete"
  | "sports_data_insufficient"
  | "report_available"
  | "missing_data";

export type CopilotTaskStatus = "open" | "due_today" | "overdue" | "informational";

export interface CopilotTask {
  id: string;
  patientId?: string;
  patientName?: string;
  type: CopilotTaskType;
  module: CopilotFindingModule;
  severity: CopilotSeverity;
  title: string;
  description: string;
  source: string;
  dueDate?: string | null;
  actionHref: string;
  actionLabel: string;
  status: CopilotTaskStatus;
}

export type CopilotTimelineEventType =
  | "alert"
  | "lab"
  | "appointment"
  | "plan"
  | "report"
  | "enteral"
  | "parenteral"
  | "sports"
  | "pediatric"
  | "message"
  | "patient";

export interface CopilotTimelineEvent {
  id: string;
  patientId?: string;
  patientName?: string;
  type: CopilotTimelineEventType;
  module: CopilotFindingModule;
  severity: CopilotSeverity;
  title: string;
  description: string;
  source: string;
  occurredAt?: string | null;
  href: string;
}

export interface CopilotPriority {
  patientId: string;
  patientName: string;
  severity: CopilotSeverity;
  score: number;
  reasons: string[];
  href: string;
}

export interface CopilotPatientSummary {
  patientId: string;
  patientName: string;
  risk: RiskLevel;
  location: string;
  findingCount: number;
  nextAction: string;
  href: string;
}

export interface CopilotRulesResult {
  priorities: CopilotPriority[];
  patientSummaries: CopilotPatientSummary[];
  operationalFindings: CopilotFinding[];
  suggestedActions: CopilotFinding[];
  missingData: CopilotFinding[];
  risks: CopilotFinding[];
  tasks: CopilotTask[];
  timeline: CopilotTimelineEvent[];
}

const severityScore: Record<CopilotSeverity, number> = {
  info: 1,
  low: 2,
  moderate: 4,
  high: 7,
  critical: 10,
};

const activeStatuses = new Set(["active", "open", "attended", "reviewed"]);

function patientNameById(patients: CopilotPatientInput[]) {
  return new Map(patients.map((patient) => [patient.id, patient.fullName]));
}

function isActiveAlert(alert: CopilotAlertInput) {
  return alert.status === "active" || alert.status === "open";
}

function isPlanActive(plan: CopilotPlanInput) {
  return activeStatuses.has(plan.status);
}

function isUpcomingAppointment(appointment: CopilotAppointmentInput, now: Date) {
  if (appointment.status !== "scheduled") return false;
  const startsAt = new Date(appointment.startsAt);
  if (Number.isNaN(startsAt.getTime())) return false;
  const diffMs = startsAt.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function isOverdueAppointment(appointment: CopilotAppointmentInput, now: Date) {
  if (appointment.status !== "scheduled") return false;
  const startsAt = new Date(appointment.startsAt);
  if (Number.isNaN(startsAt.getTime())) return false;
  return startsAt.getTime() < now.getTime();
}

function hasFutureAppointment(appointments: CopilotAppointmentInput[], patientId: string, now: Date) {
  return appointments.some((appointment) => {
    if (appointment.patientId !== patientId || appointment.status !== "scheduled") return false;
    const startsAt = new Date(appointment.startsAt);
    return !Number.isNaN(startsAt.getTime()) && startsAt.getTime() >= now.getTime();
  });
}

function enteralIsRisky(plan: CopilotEnteralInput) {
  const tolerance = String(plan.toleranceStatus ?? "").toLowerCase();
  return (
    tolerance === "poor" ||
    tolerance === "critical" ||
    tolerance.includes("mala") ||
    tolerance.includes("crit") ||
    (typeof plan.volumeDeliveredPct === "number" && plan.volumeDeliveredPct < 80)
  );
}

function parenteralIsActive(plan: CopilotParenteralInput) {
  return activeStatuses.has(plan.status);
}

function finiteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

function sportsSnapshotIsInsufficient(snapshot: CopilotSportsSnapshotInput | undefined) {
  if (!snapshot) return true;
  return !finiteNumber(snapshot.endomorphy) || !finiteNumber(snapshot.mesomorphy) || !finiteNumber(snapshot.ectomorphy);
}

function pushFinding(target: CopilotFinding[], finding: CopilotFinding) {
  target.push(finding);
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function taskTypeForFinding(type: CopilotFindingType): CopilotTaskType {
  if (type === "active_alert") return "alert_review";
  if (type === "critical_lab" || type === "out_of_range_lab") return "lab_review";
  if (type === "missing_plan") return "plan_missing";
  if (type === "upcoming_appointment" || type === "overdue_follow_up" || type === "no_follow_up") return "appointment_followup";
  if (type === "enteral_tolerance") return "enteral_tolerance";
  if (type === "parenteral_active") return "parenteral_monitoring";
  if (type === "pediatric_reference_incomplete") return "pediatric_reference_incomplete";
  if (type === "sports_insufficient_data") return "sports_data_insufficient";
  if (type === "recent_report") return "report_available";
  return "missing_data";
}

function timelineTypeForFinding(type: CopilotFindingType): CopilotTimelineEventType {
  if (type === "active_alert") return "alert";
  if (type === "critical_lab" || type === "out_of_range_lab") return "lab";
  if (type === "missing_plan") return "plan";
  if (type === "upcoming_appointment" || type === "overdue_follow_up" || type === "no_follow_up") return "appointment";
  if (type === "enteral_tolerance") return "enteral";
  if (type === "parenteral_active") return "parenteral";
  if (type === "pediatric_reference_incomplete") return "pediatric";
  if (type === "sports_insufficient_data") return "sports";
  if (type === "recent_report") return "report";
  return "patient";
}

function taskStatusForFinding(finding: CopilotFinding, now: Date): CopilotTaskStatus {
  if (finding.type === "recent_report") return "informational";
  if (!finding.dueDate) return "open";
  const dueDate = new Date(finding.dueDate);
  if (Number.isNaN(dueDate.getTime())) return "open";
  if (dueDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) return "overdue";
  if (isSameCalendarDay(dueDate, now)) return "due_today";
  return "open";
}

function uniqueFindings(findings: CopilotFinding[]) {
  const byId = new Map<string, CopilotFinding>();
  findings.forEach((finding) => byId.set(finding.id, finding));
  return [...byId.values()];
}

function buildTasksFromFindings(findings: CopilotFinding[], now: Date): CopilotTask[] {
  return uniqueFindings(findings)
    .map<CopilotTask>((finding) => ({
      id: `task-${finding.id}`,
      patientId: finding.patientId,
      patientName: finding.patientName,
      type: taskTypeForFinding(finding.type),
      module: finding.module,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      source: finding.source,
      dueDate: finding.dueDate ?? null,
      actionHref: finding.href,
      actionLabel: finding.actionLabel,
      status: taskStatusForFinding(finding, now),
    }))
    .sort((left, right) => {
      const statusScore: Record<CopilotTaskStatus, number> = { overdue: 4, due_today: 3, open: 2, informational: 1 };
      const byStatus = statusScore[right.status] - statusScore[left.status];
      if (byStatus !== 0) return byStatus;
      const bySeverity = severityScore[right.severity] - severityScore[left.severity];
      if (bySeverity !== 0) return bySeverity;
      return String(left.dueDate ?? "").localeCompare(String(right.dueDate ?? ""));
    });
}

function buildTimelineFromFindings(findings: CopilotFinding[]): CopilotTimelineEvent[] {
  return uniqueFindings(findings)
    .map<CopilotTimelineEvent>((finding) => ({
      id: `event-${finding.id}`,
      patientId: finding.patientId,
      patientName: finding.patientName,
      type: timelineTypeForFinding(finding.type),
      module: finding.module,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      source: finding.source,
      occurredAt: finding.occurredAt ?? finding.dueDate ?? null,
      href: finding.href,
    }))
    .sort((left, right) => String(right.occurredAt ?? "").localeCompare(String(left.occurredAt ?? "")));
}

export function buildCopilotRules(input: BuildCopilotRulesInput): CopilotRulesResult {
  const now = input.now ?? new Date();
  const names = patientNameById(input.patients);
  const operationalFindings: CopilotFinding[] = [];
  const suggestedActions: CopilotFinding[] = [];
  const missingData: CopilotFinding[] = [];
  const risks: CopilotFinding[] = [];
  const reasonsByPatient = new Map<string, string[]>();
  const scoreByPatient = new Map<string, number>();
  const maxSeverityByPatient = new Map<string, CopilotSeverity>();

  function addPatientSignal(patientId: string, severity: CopilotSeverity, reason: string) {
    const reasons = reasonsByPatient.get(patientId) ?? [];
    reasons.push(reason);
    reasonsByPatient.set(patientId, reasons);
    scoreByPatient.set(patientId, (scoreByPatient.get(patientId) ?? 0) + severityScore[severity]);
    const currentSeverity = maxSeverityByPatient.get(patientId) ?? "info";
    if (severityScore[severity] > severityScore[currentSeverity]) {
      maxSeverityByPatient.set(patientId, severity);
    }
  }

  for (const patient of input.patients) {
    if (patient.risk === "high" || patient.risk === "critical") {
      const finding: CopilotFinding = {
        id: `patient-risk-${patient.id}`,
        type: "patient_risk",
        patientId: patient.id,
        patientName: patient.fullName,
        title: "Paciente priorizado por riesgo",
        description: `Riesgo ${patient.risk}. Revisar expediente y alertas asociadas antes de nuevas acciones.`,
        severity: patient.risk,
        module: "patients",
        source: "patients.risk",
        actionLabel: "Abrir expediente",
        href: `/app/patients/${patient.id}`,
      };
      pushFinding(risks, finding);
      pushFinding(operationalFindings, finding);
      addPatientSignal(patient.id, patient.risk, "Riesgo clínico alto o crítico");
    }
  }

  for (const alert of input.alerts.filter(isActiveAlert)) {
    const patientName = names.get(alert.patientId) ?? "Paciente";
    const finding: CopilotFinding = {
      id: `alert-${alert.id}`,
      type: "active_alert",
      patientId: alert.patientId,
      patientName,
      title: "Alerta activa",
      description: alert.message,
      severity: alert.severity,
      module: "alerts",
      source: alert.sourceType ?? "alerts",
      actionLabel: "Revisar alerta",
      href: `/app/alerts?patient=${alert.patientId}`,
      occurredAt: alert.createdAt ?? null,
    };
    pushFinding(risks, finding);
    pushFinding(operationalFindings, finding);
    addPatientSignal(alert.patientId, alert.severity, "Alerta activa");
  }

  for (const lab of input.labs) {
    if (lab.status !== "critical" && lab.status !== "out_of_range") continue;
    const severity: CopilotSeverity = lab.status === "critical" ? "critical" : "high";
    const finding: CopilotFinding = {
      id: `lab-${lab.patientId}`,
      type: lab.status === "critical" ? "critical_lab" : "out_of_range_lab",
      patientId: lab.patientId,
      patientName: names.get(lab.patientId) ?? "Paciente",
      title: lab.status === "critical" ? "Laboratorio crítico" : "Laboratorio fuera de rango",
      description: `${lab.outsideCount} marcador(es) requieren revisión desde el módulo de laboratorios.`,
      severity,
      module: "labs",
      source: "lab_results",
      actionLabel: "Abrir laboratorios",
      href: `/app/labs?patient=${lab.patientId}`,
      occurredAt: lab.resultedAt ?? null,
    };
    pushFinding(risks, finding);
    pushFinding(operationalFindings, finding);
    addPatientSignal(lab.patientId, severity, "Laboratorio fuera de rango");
  }

  const activePlanPatients = new Set(input.plans.filter(isPlanActive).map((plan) => plan.patientId));
  for (const patient of input.patients) {
    if (activePlanPatients.has(patient.id)) continue;
    const finding: CopilotFinding = {
      id: `missing-plan-${patient.id}`,
      type: "missing_plan",
      patientId: patient.id,
      patientName: patient.fullName,
      title: "Plan nutricional no activo",
      description: "No se encontró un plan nutricional activo en los datos visibles por el tenant.",
      severity: "moderate",
      module: "plans",
      source: "nutrition_plans",
      actionLabel: "Revisar planes",
      href: `/app/plans?patient=${patient.id}`,
      dueDate: patient.nextFollowUpAt ?? null,
    };
    pushFinding(missingData, finding);
    pushFinding(suggestedActions, finding);
    addPatientSignal(patient.id, "moderate", "Sin plan activo");
  }

  for (const appointment of input.appointments.filter((item) => isUpcomingAppointment(item, now))) {
    const finding: CopilotFinding = {
      id: `appointment-${appointment.patientId}-${appointment.startsAt}`,
      type: "upcoming_appointment",
      patientId: appointment.patientId,
      patientName: names.get(appointment.patientId) ?? "Paciente",
      title: "Seguimiento próximo",
      description: "Tiene una cita programada en los próximos 7 días.",
      severity: "info",
      module: "agenda",
      source: "appointments",
      actionLabel: "Ver agenda",
      href: `/app/agenda?patient=${appointment.patientId}`,
      dueDate: appointment.startsAt,
      occurredAt: appointment.startsAt,
    };
    pushFinding(operationalFindings, finding);
    pushFinding(suggestedActions, finding);
    addPatientSignal(appointment.patientId, "info", "Cita próxima");
  }

  for (const appointment of input.appointments.filter((item) => isOverdueAppointment(item, now))) {
    const finding: CopilotFinding = {
      id: `appointment-overdue-${appointment.patientId}-${appointment.startsAt}`,
      type: "overdue_follow_up",
      patientId: appointment.patientId,
      patientName: names.get(appointment.patientId) ?? "Paciente",
      title: "Seguimiento vencido",
      description: "Existe una cita programada con fecha pasada. Ver agenda antes de cerrar seguimiento.",
      severity: "moderate",
      module: "agenda",
      source: "appointments",
      actionLabel: "Ver agenda",
      href: `/app/agenda?patient=${appointment.patientId}`,
      dueDate: appointment.startsAt,
      occurredAt: appointment.startsAt,
    };
    pushFinding(operationalFindings, finding);
    pushFinding(suggestedActions, finding);
    addPatientSignal(appointment.patientId, "moderate", "Seguimiento vencido");
  }

  for (const patient of input.patients) {
    if (patient.nextFollowUpAt || hasFutureAppointment(input.appointments, patient.id, now)) continue;
    const finding: CopilotFinding = {
      id: `no-follow-up-${patient.id}`,
      type: "no_follow_up",
      patientId: patient.id,
      patientName: patient.fullName,
      title: "Sin seguimiento programado",
      description: "No se encontró una cita próxima ni fecha de seguimiento registrada en los datos visibles.",
      severity: "low",
      module: "agenda",
      source: "appointments",
      actionLabel: "Revisar agenda",
      href: `/app/agenda?patient=${patient.id}`,
    };
    pushFinding(missingData, finding);
    pushFinding(suggestedActions, finding);
    addPatientSignal(patient.id, "low", "Sin seguimiento programado");
  }

  if (!input.pediatricReferenceComplete) {
    for (const patient of input.patients.filter((item) => item.activePacks?.includes("pediatric"))) {
      const finding: CopilotFinding = {
        id: `pediatric-reference-${patient.id}`,
        type: "pediatric_reference_incomplete",
        patientId: patient.id,
        patientName: patient.fullName,
        title: "Referencia pediátrica incompleta",
        description: "No se calcula z-score ni percentil hasta cargar referencias oficiales WHO/OMS completas.",
        severity: "moderate",
        module: "pediatric",
        source: "growth_reference_points",
        actionLabel: "Abrir pediatría",
        href: `/app/pediatric-curves?patient=${patient.id}`,
      };
      pushFinding(missingData, finding);
      pushFinding(operationalFindings, finding);
      addPatientSignal(patient.id, "moderate", "Referencia pediátrica incompleta");
    }
  }

  for (const enteralPlan of input.enteralPlans.filter(enteralIsRisky)) {
    const finding: CopilotFinding = {
      id: `enteral-risk-${enteralPlan.patientId}`,
      type: "enteral_tolerance",
      patientId: enteralPlan.patientId,
      patientName: names.get(enteralPlan.patientId) ?? "Paciente",
      title: "Riesgo enteral",
      description: "El último control enteral muestra baja entrega o tolerancia comprometida.",
      severity: "high",
      module: "enteral",
      source: "enteral_daily_logs",
      actionLabel: "Abrir soporte enteral",
      href: "/app/pack/enteral/cockpit",
      occurredAt: enteralPlan.latestLogAt ?? enteralPlan.createdAt ?? null,
    };
    pushFinding(risks, finding);
    pushFinding(operationalFindings, finding);
    addPatientSignal(enteralPlan.patientId, "high", "Tolerancia enteral comprometida");
  }

  for (const parenteralPlan of input.parenteralPlans.filter(parenteralIsActive)) {
    const finding: CopilotFinding = {
      id: `parenteral-active-${parenteralPlan.patientId}`,
      type: "parenteral_active",
      patientId: parenteralPlan.patientId,
      patientName: names.get(parenteralPlan.patientId) ?? "Paciente",
      title: "Soporte parenteral activo",
      description: parenteralPlan.latestLogAt
        ? "Tiene soporte parenteral activo con monitoreo registrado."
        : "Tiene soporte parenteral activo sin monitoreo reciente visible.",
      severity: parenteralPlan.latestLogAt ? "info" : "moderate",
      module: "parenteral",
      source: "parenteral_plans",
      actionLabel: "Abrir soporte parenteral",
      href: "/app/pack/parenteral",
      occurredAt: parenteralPlan.latestLogAt ?? null,
    };
    pushFinding(operationalFindings, finding);
    pushFinding(suggestedActions, finding);
    addPatientSignal(parenteralPlan.patientId, parenteralPlan.latestLogAt ? "info" : "moderate", "Soporte parenteral activo");
  }

  const latestSportsSnapshotByPatient = new Map<string, CopilotSportsSnapshotInput>();
  for (const snapshot of input.sportsSnapshots) {
    const current = latestSportsSnapshotByPatient.get(snapshot.patientId);
    if (!current || String(snapshot.measuredAt ?? "").localeCompare(String(current.measuredAt ?? "")) > 0) {
      latestSportsSnapshotByPatient.set(snapshot.patientId, snapshot);
    }
  }
  const sportsProfilePatientIds = new Set(input.sportsProfiles.map((profile) => profile.patientId));
  for (const patient of input.patients) {
    const hasSportsSignal =
      sportsProfilePatientIds.has(patient.id) ||
      patient.activePacks?.some((pack) => ["sport", "sports", "sports_performance", "deportivo"].includes(pack));
    if (!hasSportsSignal) continue;
    const latestSnapshot = latestSportsSnapshotByPatient.get(patient.id);
    if (!sportsSnapshotIsInsufficient(latestSnapshot)) continue;
    const finding: CopilotFinding = {
      id: `sports-insufficient-${patient.id}`,
      type: "sports_insufficient_data",
      patientId: patient.id,
      patientName: patient.fullName,
      title: "Datos deportivos insuficientes",
      description: "No se calcula somatotipo ni somatocarta hasta contar con componentes antropométricos suficientes.",
      severity: "moderate",
      module: "sports",
      source: "sports_bodycomp_snapshots",
      actionLabel: "Abrir somatocarta",
      href: `/app/somatocarta?patient=${patient.id}`,
      occurredAt: latestSnapshot?.measuredAt ?? null,
    };
    pushFinding(missingData, finding);
    pushFinding(operationalFindings, finding);
    addPatientSignal(patient.id, "moderate", "Datos deportivos insuficientes");
  }

  const latestReport = [...input.reports].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if (latestReport) {
    pushFinding(suggestedActions, {
      id: `report-${latestReport.id}`,
      type: "recent_report",
      title: "Reporte reciente disponible",
      description: `Último reporte: ${latestReport.reportType}. Abrir reportes para revisar estado y trazabilidad.`,
      severity: "info",
      module: "reports",
      source: "report_runs",
      actionLabel: "Abrir reportes",
      href: "/app/reports",
      occurredAt: latestReport.createdAt,
    });
  }

  const priorities = [...scoreByPatient.entries()]
    .map<CopilotPriority>(([patientId, score]) => {
      const patient = input.patients.find((item) => item.id === patientId);
      const reasons = reasonsByPatient.get(patientId) ?? [];
      const scoreSeverity: CopilotSeverity =
        score >= 14 ? "critical" : score >= 8 ? "high" : score >= 4 ? "moderate" : "info";
      const signalSeverity = maxSeverityByPatient.get(patientId) ?? "info";
      const severity =
        severityScore[signalSeverity] > severityScore[scoreSeverity] ? signalSeverity : scoreSeverity;
      return {
        patientId,
        patientName: patient?.fullName ?? names.get(patientId) ?? "Paciente",
        severity,
        score,
        reasons,
        href: `/app/patients/${patientId}`,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);

  const patientSummaries = input.patients.slice(0, 12).map<CopilotPatientSummary>((patient) => {
    const patientFindings = operationalFindings.filter((finding) => finding.patientId === patient.id);
    return {
      patientId: patient.id,
      patientName: patient.fullName,
      risk: patient.risk,
      location: patient.location ?? "Sin ubicación",
      findingCount: patientFindings.length,
      nextAction:
        patientFindings[0]?.title ??
        (activePlanPatients.has(patient.id) ? "Seguimiento regular" : "Revisar plan nutricional"),
      href: `/app/patients/${patient.id}`,
    };
  });

  const taskFindings = uniqueFindings([...risks, ...operationalFindings, ...suggestedActions, ...missingData]);
  const tasks = buildTasksFromFindings(taskFindings, now);
  const timeline = buildTimelineFromFindings(taskFindings).slice(0, 20);

  return {
    priorities,
    patientSummaries,
    operationalFindings: operationalFindings.slice(0, 12),
    suggestedActions: suggestedActions.slice(0, 10),
    missingData: missingData.slice(0, 10),
    risks: risks.slice(0, 10),
    tasks: tasks.slice(0, 20),
    timeline,
  };
}
