import {
  buildCopilotRules,
  type BuildCopilotRulesInput,
  type CopilotFinding,
  type CopilotPatientSummary,
  type CopilotPriority,
  type CopilotRulesResult,
  type CopilotTask,
  type CopilotTimelineEvent,
} from "@/domain/copilot/copilotRules";

export interface CopilotOverview {
  patientCount: number;
  priorityCount: number;
  findingCount: number;
  riskCount: number;
  missingDataCount: number;
  taskCount: number;
  todayAttentionCount: number;
  generatedAt: string;
}

export interface CopilotQuickLink {
  id: string;
  label: string;
  href: string;
  module: string;
  requiredPermission?: string;
  status: "available" | "requires_permission" | "coming_soon";
}

export interface CopilotSelectedPatientContext {
  patientId: string;
  patientName: string;
  href: string;
  risk: CopilotPatientSummary["risk"];
  priority: CopilotPriority | null;
  findings: CopilotFinding[];
  missingData: CopilotFinding[];
  suggestedActions: CopilotFinding[];
  risks: CopilotFinding[];
  tasks: CopilotTask[];
  timeline: CopilotTimelineEvent[];
  hasSignals: boolean;
}

export interface CopilotTaskSummary {
  total: number;
  overdue: number;
  dueToday: number;
  byModule: Record<string, number>;
  bySeverity: Record<string, number>;
}

export type CopilotContextResult = CopilotRulesResult & {
  overview: CopilotOverview;
  quickLinks: CopilotQuickLink[];
  taskSummary: CopilotTaskSummary;
  todayAttention: CopilotTask[];
  selectedPatientContext: CopilotSelectedPatientContext | null;
  isEmpty: boolean;
  generatedAt: string;
  source: "supabase";
};

function buildQuickLinks(): CopilotQuickLink[] {
  return [
    { id: "patients", label: "Abrir pacientes", href: "/app/patients", module: "patients", status: "available" },
    { id: "alerts", label: "Ver alertas", href: "/app/alerts", module: "alerts", requiredPermission: "alerts.read", status: "available" },
    { id: "labs", label: "Ver laboratorios", href: "/app/labs", module: "labs", status: "available" },
    { id: "agenda", label: "Ver agenda", href: "/app/agenda", module: "agenda", requiredPermission: "appointments.read", status: "available" },
    { id: "plans", label: "Ver plan nutricional", href: "/app/plans", module: "plans", requiredPermission: "nutrition_plans.approve", status: "available" },
    { id: "enteral", label: "Ver soporte enteral", href: "/app/pack/enteral/cockpit", module: "enteral", requiredPermission: "enteral.read", status: "available" },
    { id: "parenteral", label: "Ver soporte parenteral", href: "/app/pack/parenteral", module: "parenteral", requiredPermission: "parenteral.read", status: "available" },
    { id: "sports", label: "Ver somatocarta", href: "/app/somatocarta", module: "sports", requiredPermission: "sports.read", status: "available" },
    { id: "pediatric", label: "Ver pediatría", href: "/app/pediatric-curves", module: "pediatric", requiredPermission: "pediatric_growth.read", status: "available" },
    { id: "messages", label: "Ver mensajes", href: "/app/messages", module: "messages", requiredPermission: "messages.read", status: "available" },
    { id: "reports", label: "Ver reportes", href: "/app/reports", module: "reports", requiredPermission: "reports.export", status: "available" },
    { id: "generate-report", label: "Generar reporte", href: "/app/reports", module: "reports", requiredPermission: "reports.export", status: "available" },
    { id: "create-appointment", label: "Crear cita", href: "/app/agenda", module: "agenda", requiredPermission: "appointments.create", status: "coming_soon" },
    { id: "create-note", label: "Crear nota", href: "/app/patients", module: "notes", requiredPermission: "clinical_notes.create", status: "coming_soon" },
  ];
}

function selectPatientContext(result: CopilotRulesResult, selectedPatientId?: string | null): CopilotSelectedPatientContext | null {
  const patientId = selectedPatientId ?? result.priorities[0]?.patientId ?? result.patientSummaries[0]?.patientId ?? null;
  if (!patientId) return null;

  const summary = result.patientSummaries.find((patient) => patient.patientId === patientId);
  const priority = result.priorities.find((item) => item.patientId === patientId) ?? null;
  if (!summary && !priority) return null;

  const findings = result.operationalFindings.filter((finding) => finding.patientId === patientId);
  const missingData = result.missingData.filter((finding) => finding.patientId === patientId);
  const suggestedActions = result.suggestedActions.filter((finding) => finding.patientId === patientId);
  const risks = result.risks.filter((finding) => finding.patientId === patientId);
  const tasks = result.tasks.filter((task) => task.patientId === patientId);
  const timeline = result.timeline.filter((event) => event.patientId === patientId);

  return {
    patientId,
    patientName: priority?.patientName ?? summary?.patientName ?? "Paciente",
    href: priority?.href ?? summary?.href ?? `/app/patients/${patientId}`,
    risk: summary?.risk ?? "moderate",
    priority,
    findings,
    missingData,
    suggestedActions,
    risks,
    tasks,
    timeline,
    hasSignals:
      findings.length > 0 ||
      missingData.length > 0 ||
      suggestedActions.length > 0 ||
      risks.length > 0 ||
      tasks.length > 0 ||
      timeline.length > 0 ||
      Boolean(priority),
  };
}

function buildTaskSummary(tasks: CopilotTask[]): CopilotTaskSummary {
  return tasks.reduce<CopilotTaskSummary>(
    (summary, task) => {
      summary.total += 1;
      if (task.status === "overdue") summary.overdue += 1;
      if (task.status === "due_today") summary.dueToday += 1;
      summary.byModule[task.module] = (summary.byModule[task.module] ?? 0) + 1;
      summary.bySeverity[task.severity] = (summary.bySeverity[task.severity] ?? 0) + 1;
      return summary;
    },
    { total: 0, overdue: 0, dueToday: 0, byModule: {}, bySeverity: {} },
  );
}

function buildTodayAttention(tasks: CopilotTask[]) {
  return tasks
    .filter((task) =>
      task.status === "overdue" ||
      task.status === "due_today" ||
      task.type === "alert_review" ||
      task.type === "lab_review" ||
      task.type === "enteral_tolerance" ||
      task.type === "plan_missing" ||
      task.severity === "critical" ||
      task.severity === "high",
    )
    .slice(0, 8);
}

export function composeCopilotContext(input: BuildCopilotRulesInput, selectedPatientId?: string | null): CopilotContextResult {
  const result = buildCopilotRules(input);
  const generatedAt = new Date().toISOString();
  const todayAttention = buildTodayAttention(result.tasks);

  return {
    ...result,
    overview: {
      patientCount: input.patients.length,
      priorityCount: result.priorities.length,
      findingCount: result.operationalFindings.length,
      riskCount: result.risks.length,
      missingDataCount: result.missingData.length,
      taskCount: result.tasks.length,
      todayAttentionCount: todayAttention.length,
      generatedAt,
    },
    quickLinks: buildQuickLinks(),
    taskSummary: buildTaskSummary(result.tasks),
    todayAttention,
    selectedPatientContext: selectPatientContext(result, selectedPatientId),
    isEmpty:
      result.priorities.length === 0 &&
      result.operationalFindings.length === 0 &&
      result.suggestedActions.length === 0 &&
      result.missingData.length === 0 &&
      result.tasks.length === 0,
    generatedAt,
    source: "supabase",
  };
}
