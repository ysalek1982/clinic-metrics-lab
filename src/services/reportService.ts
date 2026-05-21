import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { calculateSomatotype } from "@/domain/sports/somatotypeEngine";
import { writeAuditLog } from "@/services/clinicalService";

export type ReportType =
  | "executive"
  | "patient_clinical"
  | "anthropometry"
  | "labs"
  | "plans"
  | "alerts"
  | "agenda"
  | "operational_nutrition"
  | "recipes"
  | "ccorp"
  | "sports_performance"
  | "pediatric";

export type ReportAvailabilityStatus = "available" | "requires_data" | "requires_patient" | "soon";
export type ReportPeriod = "last_7_days" | "last_30_days" | "this_month" | "all";

export type ReportTemplate = {
  type: ReportType;
  title: string;
  category: string;
  description: string;
  sources: string[];
  moduleNote?: string;
};

export type ReportParameters = {
  period: ReportPeriod;
  patientId?: string | null;
};

export type ReportAvailability = {
  status: ReportAvailabilityStatus;
  label: string;
  reason: string;
};

export type ReportMetric = {
  label: string;
  value: string;
  detail?: string;
  tone?: "cyan" | "green" | "yellow" | "orange" | "red" | "muted";
};

export type ReportTable = {
  title: string;
  columns: string[];
  rows: string[][];
  emptyText: string;
};

export type ReportSection = {
  title: string;
  items: string[];
};

export type ReportPreview = {
  reportType: ReportType;
  title: string;
  category: string;
  generatedAt: string;
  periodLabel: string;
  patientLabel: string | null;
  filters: ReportParameters;
  availability: ReportAvailability;
  metrics: ReportMetric[];
  sections: ReportSection[];
  tables: ReportTable[];
  warnings: string[];
};

export type ReportRunSummary = {
  id: string;
  tenantId: string;
  reportType: string;
  reportTitle: string;
  format: string;
  status: string;
  filters: Json;
  payload: Json;
  createdBy: string | null;
  createdAt: string;
};

type PatientRow = {
  id: string;
  tenant_id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  sex: string;
  status: string;
  risk_level: string;
  diagnosis_summary: string | null;
  location_label: string | null;
  next_follow_up_at: string | null;
  created_at: string;
};

type EncounterRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  type: string;
  title: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
};

type AssessmentRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  encounter_id: string | null;
  diagnosis_problem: string | null;
  conduct: string | null;
  status: string;
  created_at: string;
};

type PlanRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  type: string;
  kcal: number | string | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  fluids_ml: number | string | null;
  diet: string | null;
  restrictions: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
  next_follow_up_at?: string | null;
};

type LabOrderRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  ordered_at: string;
  resulted_at: string | null;
  status: string;
};

type LabResultRow = {
  id: string;
  tenant_id: string;
  lab_order_id: string;
  patient_id: string;
  marker_code: string;
  marker_name: string;
  category: string;
  value: number | string | null;
  unit: string;
  reference_low: number | string | null;
  reference_high: number | string | null;
  status: string;
  delta_value: number | string | null;
  resulted_at: string | null;
};

type AlertAcknowledgementRow = {
  id: string;
  tenant_id: string;
  alert_id: string;
  patient_id: string | null;
  source_type: string | null;
  status: string;
  priority: string | null;
  acknowledged_at: string;
  resolved_at: string | null;
  updated_at: string;
};

type AppointmentRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  appointment_type: string;
  status: string;
  modality: string | null;
  location: string | null;
};

type MessageThreadRow = {
  id: string;
  tenant_id: string;
  patient_id: string | null;
  subject: string;
  status: string;
  priority: string;
  channel: string;
  last_message_at: string | null;
};

type MessageRow = {
  id: string;
  tenant_id: string;
  thread_id: string;
  patient_id: string | null;
  created_at: string;
};

type FoodItemRow = {
  id: string;
  tenant_id: string | null;
  name: string;
  source_scope: string;
  kcal: number | string | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  is_active: boolean;
};

type RecipeRow = {
  id: string;
  tenant_id: string;
  name: string;
  category: string | null;
  status: string;
  portions: number | string;
  created_at: string;
};

type WeeklyMenuRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  name: string;
  week_start: string;
  status: string;
  kcal_target: number | string | null;
  protein_target_g: number | string | null;
  created_at: string;
};

type WeeklyMenuItemRow = {
  id: string;
  tenant_id: string;
  weekly_menu_id: string;
  recipe_id: string | null;
  food_item_id: string | null;
  quantity_g: number | string | null;
  portions: number | string | null;
};

type CcorpAssessmentRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  measured_at: string;
  status: string;
};

type CcorpResultRow = {
  assessment_id: string;
  tenant_id: string;
  bmi: number | string | null;
  durnin_body_fat_percent: number | string | null;
  durnin_fat_mass_kg: number | string | null;
  durnin_fat_free_mass_kg: number | string | null;
};

type SportsProfileRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  discipline: string;
  category: string;
  position: string | null;
  objective: string | null;
  created_at: string;
};

type SportsBodycompSnapshotRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  endomorphy: number | string | null;
  mesomorphy: number | string | null;
  ectomorphy: number | string | null;
  fat_pct: number | string | null;
  lean_mass_kg: number | string | null;
  skeletal_muscle_kg: number | string | null;
  notes: string | null;
  measured_at: string;
  created_at: string;
};

type ReportRunRow = {
  id: string;
  tenant_id: string;
  report_type: string;
  report_name: string;
  format: string;
  status: string;
  filters: Json;
  payload: Json;
  created_by: string | null;
  created_at: string;
};

export type ReportDataBundle = {
  patients: PatientRow[];
  encounters: EncounterRow[];
  assessments: AssessmentRow[];
  plans: PlanRow[];
  labOrders: LabOrderRow[];
  labResults: LabResultRow[];
  alertAcknowledgements: AlertAcknowledgementRow[];
  appointments: AppointmentRow[];
  messageThreads: MessageThreadRow[];
  messages: MessageRow[];
  foodItems: FoodItemRow[];
  recipes: RecipeRow[];
  weeklyMenus: WeeklyMenuRow[];
  weeklyMenuItems: WeeklyMenuItemRow[];
  ccorpAssessments: CcorpAssessmentRow[];
  ccorpResults: CcorpResultRow[];
  sportsProfiles: SportsProfileRow[];
  sportsBodycompSnapshots: SportsBodycompSnapshotRow[];
  warnings: string[];
};

type QueryResult<T> = {
  data: T[] | null;
  error: { message?: string; code?: string } | null;
};

type SingleQueryResult<T> = {
  data: T | null;
  error: { message?: string; code?: string } | null;
};

type SupabaseQueryBuilder<T = unknown> = PromiseLike<QueryResult<T>> & {
  select: (columns?: string) => SupabaseQueryBuilder<T>;
  insert: (value: unknown) => SupabaseQueryBuilder<T>;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  is: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  or: (expression: string) => SupabaseQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => SupabaseQueryBuilder<T>;
  single: () => Promise<SingleQueryResult<T>>;
};

type SupabaseAnyClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: { message?: string } | null }>;
  };
  from: <T = unknown>(table: string) => SupabaseQueryBuilder<T>;
};

const client = supabase as unknown as SupabaseAnyClient;

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: "executive",
    category: "Ejecutivo",
    title: "Reporte ejecutivo institucional",
    description: "KPIs consolidados de operación clínica, riesgo nutricional y carga asistencial.",
    sources: ["patients", "clinical_assessments", "nutrition_plans", "lab_results", "appointments", "weekly_menus"],
  },
  {
    type: "patient_clinical",
    category: "Clínico",
    title: "Reporte clínico hospitalario",
    description: "Expediente resumido por paciente con episodios, planes, laboratorios, agenda y menús.",
    sources: ["patients", "encounters", "clinical_assessments", "nutrition_plans", "lab_results", "appointments"],
  },
  {
    type: "anthropometry",
    category: "Antropometría",
    title: "Reporte antropométrico premium",
    description: "Resumen antropométrico y composición corporal disponible desde CCORP/mediciones reales.",
    sources: ["ccorp_level1_assessments", "ccorp_level1_results"],
  },
  {
    type: "labs",
    category: "Bioquímica",
    title: "Reporte de laboratorios",
    description: "Marcadores, críticos, fuera de rango e interpretación operacional por tenant.",
    sources: ["lab_orders", "lab_results"],
  },
  {
    type: "plans",
    category: "Planes",
    title: "Reporte de planes nutricionales",
    description: "Planes activos, pausados o cerrados, prescripción energética y seguimiento.",
    sources: ["nutrition_plans", "patients"],
  },
  {
    type: "alerts",
    category: "Alertas",
    title: "Reporte de alertas",
    description: "Alertas revisadas, resueltas y derivadas de laboratorios críticos o fuera de rango.",
    sources: ["alert_acknowledgements", "lab_results"],
  },
  {
    type: "agenda",
    category: "Agenda",
    title: "Reporte de agenda/citas",
    description: "Citas programadas, completadas, canceladas y distribución por modalidad.",
    sources: ["appointments", "patients"],
  },
  {
    type: "operational_nutrition",
    category: "Nutrición",
    title: "Reporte de menú semanal",
    description: "Menús semanales, alimentos y recetas con totales operativos.",
    sources: ["food_items", "recipes", "weekly_menus"],
  },
  {
    type: "recipes",
    category: "Nutrición",
    title: "Reporte de recetas",
    description: "Biblioteca de recetas institucionales, estado y disponibilidad para menús.",
    sources: ["recipes", "recipe_ingredients", "food_items"],
  },
  {
    type: "ccorp",
    category: "CCORP",
    title: "Reporte CCORP Nivel 1",
    description: "Evaluaciones CCORP, IMC, porcentaje graso y masa magra cuando existen resultados.",
    sources: ["ccorp_level1_assessments", "ccorp_level1_results"],
  },
  {
    type: "sports_performance",
    category: "Deportivo",
    title: "Reporte deportivo",
    description: "Perfil deportivo, composición corporal, somatotipo si hay datos suficientes y evolución longitudinal.",
    sources: ["sports_profiles", "sports_bodycomp_snapshots", "ccorp_level1_results"],
  },
  {
    type: "pediatric",
    category: "Pediatría",
    title: "Reporte pediátrico con curvas",
    description: "Requiere cerrar módulo pediátrico avanzado con referencias longitudinales completas.",
    sources: ["pediatric_growth_measurements"],
    moduleNote: "Requiere módulo pediátrico completo.",
  },
];

export function listReportTemplates() {
  return REPORT_TEMPLATES;
}

export async function listReportRuns(tenantId: string): Promise<ReportRunSummary[]> {
  const { data, error } = await client
    .from<ReportRunRow>("report_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message ?? "No se pudieron cargar los reportes generados.");
  return (data ?? []).map(mapReportRun);
}

export async function getReportRun(tenantId: string, reportRunId: string): Promise<ReportRunSummary | null> {
  const { data, error } = await client
    .from<ReportRunRow>("report_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", reportRunId)
    .single();

  if (error) throw new Error(error.message ?? "No se pudo cargar el reporte generado.");
  return data ? mapReportRun(data) : null;
}

export async function loadReportDataBundle(tenantId: string): Promise<ReportDataBundle> {
  const warnings: string[] = [];
  const [
    patients,
    encounters,
    assessments,
    plans,
    labOrders,
    labResults,
    alertAcknowledgements,
    appointments,
    messageThreads,
    messages,
    foodItems,
    recipes,
    weeklyMenus,
    weeklyMenuItems,
    ccorpAssessments,
    ccorpResults,
    sportsProfiles,
    sportsBodycompSnapshots,
  ] = await Promise.all([
    readRows<PatientRow>("Pacientes", client.from<PatientRow>("patients").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("last_name", { ascending: true }), warnings),
    readRows<EncounterRow>("Episodios", client.from<EncounterRow>("encounters").select("*").eq("tenant_id", tenantId).order("opened_at", { ascending: false }), warnings),
    readRows<AssessmentRow>("Evaluaciones", client.from<AssessmentRow>("clinical_assessments").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }), warnings),
    readRows<PlanRow>("Planes nutricionales", client.from<PlanRow>("nutrition_plans").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }), warnings),
    readRows<LabOrderRow>("Ordenes de laboratorio", client.from<LabOrderRow>("lab_orders").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("resulted_at", { ascending: false }), warnings),
    readRows<LabResultRow>("Resultados de laboratorio", client.from<LabResultRow>("lab_results").select("*").eq("tenant_id", tenantId).order("resulted_at", { ascending: false }), warnings),
    readRows<AlertAcknowledgementRow>("Alertas", client.from<AlertAcknowledgementRow>("alert_acknowledgements").select("*").eq("tenant_id", tenantId).order("updated_at", { ascending: false }), warnings),
    readRows<AppointmentRow>("Agenda", client.from<AppointmentRow>("appointments").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("starts_at", { ascending: false }), warnings),
    readRows<MessageThreadRow>("Mensajes", client.from<MessageThreadRow>("message_threads").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("last_message_at", { ascending: false }), warnings),
    readRows<MessageRow>("Mensajes enviados", client.from<MessageRow>("messages").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false }), warnings),
    readRows<FoodItemRow>("Alimentos", client.from<FoodItemRow>("food_items").select("*").or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).eq("is_active", true).order("name", { ascending: true }), warnings),
    readRows<RecipeRow>("Recetas", client.from<RecipeRow>("recipes").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false }), warnings),
    readRows<WeeklyMenuRow>("Menus semanales", client.from<WeeklyMenuRow>("weekly_menus").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("week_start", { ascending: false }), warnings),
    readRows<WeeklyMenuItemRow>("Items de menu semanal", client.from<WeeklyMenuItemRow>("weekly_menu_items").select("*").eq("tenant_id", tenantId), warnings),
    readRows<CcorpAssessmentRow>("CCORP Nivel 1", client.from<CcorpAssessmentRow>("ccorp_level1_assessments").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("measured_at", { ascending: false }), warnings),
    readRows<CcorpResultRow>("Resultados CCORP", client.from<CcorpResultRow>("ccorp_level1_results").select("*").eq("tenant_id", tenantId), warnings),
    readRows<SportsProfileRow>("Perfiles deportivos", client.from<SportsProfileRow>("sports_profiles").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }), warnings),
    readRows<SportsBodycompSnapshotRow>("Evaluaciones deportivas", client.from<SportsBodycompSnapshotRow>("sports_bodycomp_snapshots").select("*").eq("tenant_id", tenantId).order("measured_at", { ascending: false }), warnings),
  ]);

  return {
    patients,
    encounters,
    assessments,
    plans,
    labOrders,
    labResults,
    alertAcknowledgements,
    appointments,
    messageThreads,
    messages,
    foodItems,
    recipes,
    weeklyMenus,
    weeklyMenuItems,
    ccorpAssessments,
    ccorpResults,
    sportsProfiles,
    sportsBodycompSnapshots,
    warnings,
  };
}

export function previewReport(bundle: ReportDataBundle, reportType: ReportType, parameters: ReportParameters): ReportPreview {
  const template = REPORT_TEMPLATES.find((item) => item.type === reportType) ?? REPORT_TEMPLATES[0];
  const availability = resolveAvailability(template, bundle, parameters);
  const patient = parameters.patientId ? bundle.patients.find((item) => item.id === parameters.patientId) ?? null : null;
  const context = { bundle, template, parameters, availability, patient };

  switch (reportType) {
    case "patient_clinical":
      return buildPatientClinicalPreview(context);
    case "labs":
      return buildLabsPreview(context);
    case "agenda":
      return buildAgendaPreview(context);
    case "operational_nutrition":
      return buildOperationalNutritionPreview(context);
    case "plans":
      return buildPlansPreview(context);
    case "alerts":
      return buildAlertsPreview(context);
    case "anthropometry":
    case "ccorp":
      return buildCcorpPreview(context);
    case "recipes":
      return buildRecipesPreview(context);
    case "sports_performance":
      return buildSportsPerformancePreview(context);
    case "pediatric":
      return buildPediatricPreview(context);
    case "executive":
    default:
      return buildExecutivePreview(context);
  }
}

export async function generateReportRun(tenantId: string, reportType: ReportType, parameters: ReportParameters): Promise<ReportRunSummary> {
  const actorUserId = await currentUserId();
  const bundle = await loadReportDataBundle(tenantId);
  const preview = previewReport(bundle, reportType, parameters);

  if (preview.availability.status !== "available") {
    throw new Error(preview.availability.reason);
  }

  const { data, error } = await client
    .from<ReportRunRow>("report_runs")
    .insert({
      tenant_id: tenantId,
      report_type: preview.reportType,
      report_name: preview.title,
      format: "web",
      status: "completed",
      filters: toJson(parameters),
      payload: toJson(preview),
      created_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "No se pudo generar el reporte.");

  await writeAuditLog({
    tenantId,
    actorUserId,
    eventType: "report.generated",
    entityType: "report_runs",
    entityId: data.id,
    afterData: toJson({
      report_type: preview.reportType,
      report_title: preview.title,
      parameters,
      metrics: preview.metrics,
    }),
  });

  return mapReportRun(data);
}

export async function auditReportPrinted(tenantId: string, preview: ReportPreview, reportRunId?: string | null) {
  const actorUserId = await currentUserId();
  await writeAuditLog({
    tenantId,
    actorUserId,
    eventType: "report.printed",
    entityType: "report_runs",
    entityId: reportRunId ?? null,
    afterData: toJson({
      report_type: preview.reportType,
      report_title: preview.title,
      parameters: preview.filters,
    }),
  });
}

export async function auditReportExported(
  tenantId: string,
  preview: ReportPreview,
  format: "pdf" | "xlsx",
  reportRunId?: string | null,
) {
  const actorUserId = await currentUserId();
  await writeAuditLog({
    tenantId,
    actorUserId,
    eventType: "report.exported",
    entityType: "report_runs",
    entityId: reportRunId ?? null,
    afterData: toJson({
      report_type: preview.reportType,
      report_title: preview.title,
      format,
      parameters: preview.filters,
    }),
  });
}

function buildExecutivePreview(context: BuildContext): ReportPreview {
  const { bundle, parameters } = context;
  const patients = applyPeriod(bundle.patients, parameters, "created_at");
  const assessments = applyPeriod(bundle.assessments, parameters, "created_at");
  const appointments = applyPeriod(bundle.appointments, parameters, "starts_at");
  const activePlans = bundle.plans.filter((plan) => ["active", "approved", "draft"].includes(plan.status));
  const activeWeeklyMenus = bundle.weeklyMenus.filter((menu) => menu.status === "active");
  const closedWeeklyMenus = bundle.weeklyMenus.filter((menu) => menu.status === "closed");
  const abnormalLabs = bundle.labResults.filter((result) => result.status === "out_of_range" || result.status === "critical");
  const criticalLabs = bundle.labResults.filter((result) => result.status === "critical");
  const reviewedAlerts = bundle.alertAcknowledgements.filter((alert) => alert.status === "reviewed");
  const resolvedAlerts = bundle.alertAcknowledgements.filter((alert) => alert.status === "resolved");

  return basePreview(context, {
    metrics: [
      metric("Pacientes activos", String(bundle.patients.filter((patient) => patient.status === "active").length), "Tenant actual", "cyan"),
      metric("Evaluaciones", String(assessments.length), periodLabel(parameters.period), "green"),
      metric("Alertas activas/resueltas", `${reviewedAlerts.length}/${resolvedAlerts.length}`, "Revisadas / resueltas", "orange"),
      metric("Citas del periodo", String(appointments.length), appointmentStatusSummary(appointments), "cyan"),
      metric("Planes activos", String(activePlans.length), "Planes en seguimiento", "green"),
      metric("Labs fuera de rango", String(abnormalLabs.length), `${criticalLabs.length} críticos`, criticalLabs.length ? "red" : "yellow"),
      metric("Menús activos/cerrados", `${activeWeeklyMenus.length}/${closedWeeklyMenus.length}`, "Activos / cerrados", "cyan"),
    ],
    sections: [
      section("Lectura ejecutiva", [
        `Pacientes creados en el periodo: ${patients.length}`,
        `Ordenes de laboratorio del tenant: ${bundle.labOrders.length}`,
        `Hilos clínicos registrados: ${bundle.messageThreads.length}`,
        `Recetas institucionales activas: ${bundle.recipes.filter((recipe) => recipe.status === "active").length}`,
      ]),
    ],
    tables: [
      table("Pacientes priorizados", ["Paciente", "MRN", "Riesgo", "Diagnóstico", "Ubicación"], riskPatients(bundle).map((patient) => [
        patientName(patient),
        patient.mrn,
        presentRisk(patient.risk_level),
        patient.diagnosis_summary ?? "Sin diagnóstico",
        patient.location_label ?? "Sin ubicación",
      ]), "No hay pacientes en riesgo alto o crítico."),
      table("Laboratorios fuera de rango", ["Paciente", "Marcador", "Valor", "Estado", "Fecha"], abnormalLabs.slice(0, 12).map((result) => [
        patientLabel(bundle, result.patient_id),
        result.marker_name,
        `${valueLabel(result.value)} ${result.unit}`,
        presentLabStatus(result.status),
        formatDate(result.resulted_at),
      ]), "No hay laboratorios fuera de rango."),
    ],
  });
}

function buildPatientClinicalPreview(context: BuildContext): ReportPreview {
  const { bundle, parameters, patient } = context;
  const patientId = parameters.patientId ?? "";
  const rows = {
    encounters: bundle.encounters.filter((item) => item.patient_id === patientId),
    assessments: bundle.assessments.filter((item) => item.patient_id === patientId),
    plans: bundle.plans.filter((item) => item.patient_id === patientId),
    labs: bundle.labResults.filter((item) => item.patient_id === patientId),
    appointments: bundle.appointments.filter((item) => item.patient_id === patientId),
    messages: bundle.messageThreads.filter((item) => item.patient_id === patientId),
    menus: bundle.weeklyMenus.filter((item) => item.patient_id === patientId),
    alerts: bundle.alertAcknowledgements.filter((item) => item.patient_id === patientId),
  };

  return basePreview(context, {
    metrics: [
      metric("Paciente", patient ? patientName(patient) : "Selecciona paciente", patient?.mrn ?? "Sin MRN", "cyan"),
      metric("Episodios", String(rows.encounters.length), "Historial clínico", "green"),
      metric("Evaluaciones", String(rows.assessments.length), "Evaluaciones reales", "green"),
      metric("Planes", String(rows.plans.length), "Planes nutricionales", "yellow"),
      metric("Labs", String(rows.labs.length), "Marcadores", "cyan"),
      metric("Citas", String(rows.appointments.length), "Agenda", "orange"),
      metric("Menús", String(rows.menus.length), "Planificación semanal", "green"),
    ],
    sections: [
      section("Datos del paciente", [
        patient ? `Nombre: ${patientName(patient)}` : "Selecciona un paciente para generar el reporte clínico.",
        patient ? `Diagnóstico: ${patient.diagnosis_summary ?? "Sin diagnóstico"}` : "Sin paciente seleccionado.",
        patient ? `Riesgo: ${presentRisk(patient.risk_level)}` : "Sin riesgo disponible.",
        patient ? `Próximo seguimiento: ${formatDate(patient.next_follow_up_at)}` : "Sin seguimiento disponible.",
      ]),
    ],
    tables: [
      table("Episodios", ["Tipo", "Motivo", "Estado", "Apertura", "Cierre"], rows.encounters.map((item) => [
        presentEncounterType(item.type),
        item.title,
        presentStatus(item.status),
        formatDate(item.opened_at),
        formatDate(item.closed_at),
      ]), "No hay episodios para este paciente."),
      table("Evaluaciones", ["Fecha", "Diagnóstico", "Conducta", "Estado"], rows.assessments.map((item) => [
        formatDate(item.created_at),
        item.diagnosis_problem ?? "Sin diagnóstico",
        item.conduct ?? "Sin conducta",
        presentStatus(item.status),
      ]), "No hay evaluaciones para este paciente."),
      table("Planes y menús", ["Tipo", "Estado", "Kcal/Meta", "Detalle"], [
        ...rows.plans.map((item) => [item.type, presentStatus(item.status), valueLabel(item.kcal), item.diet ?? "Sin dieta"]),
        ...rows.menus.map((item) => ["Menú semanal", presentStatus(item.status), valueLabel(item.kcal_target), `${item.name} · ${item.week_start}`]),
      ], "No hay planes ni menús para este paciente."),
      table("Laboratorios", ["Marcador", "Valor", "Estado", "Fecha"], rows.labs.slice(0, 20).map((item) => [
        item.marker_name,
        `${valueLabel(item.value)} ${item.unit}`,
        presentLabStatus(item.status),
        formatDate(item.resulted_at),
      ]), "No hay laboratorios para este paciente."),
      table("Agenda y mensajes", ["Tipo", "Estado", "Fecha/Asunto", "Detalle"], [
        ...rows.appointments.map((item) => [presentAppointmentType(item.appointment_type), presentStatus(item.status), formatDate(item.starts_at), item.location ?? item.modality ?? "Sin detalle"]),
        ...rows.messages.map((item) => ["Mensaje", presentStatus(item.status), formatDate(item.last_message_at), item.subject]),
      ], "No hay citas ni mensajes asociados."),
    ],
  });
}

function buildLabsPreview(context: BuildContext): ReportPreview {
  const { bundle, parameters } = context;
  const labs = applyPeriod(bundle.labResults, parameters, "resulted_at");
  const abnormal = labs.filter((item) => item.status === "out_of_range" || item.status === "critical");
  const critical = labs.filter((item) => item.status === "critical");

  return basePreview(context, {
    metrics: [
      metric("Pacientes con labs", String(new Set(bundle.labOrders.map((order) => order.patient_id)).size), "Pacientes únicos", "cyan"),
      metric("Órdenes", String(applyPeriod(bundle.labOrders, parameters, "resulted_at").length), periodLabel(parameters.period), "green"),
      metric("Marcadores", String(labs.length), "Resultados", "cyan"),
      metric("Fuera de rango", String(abnormal.length), "Incluye críticos", abnormal.length ? "orange" : "green"),
      metric("Críticos", String(critical.length), "Requieren revisión", critical.length ? "red" : "green"),
    ],
    sections: [
      section("Interpretación operacional", [
        critical.length ? `${critical.length} marcador(es) críticos requieren revisión prioritaria.` : "No hay marcadores críticos en el periodo.",
        abnormal.length ? `${abnormal.length} marcador(es) fuera de rango detectados.` : "No hay marcadores fuera de rango en el periodo.",
      ]),
    ],
    tables: [
      table("Marcadores alterados", ["Paciente", "Marcador", "Categoría", "Actual", "Delta", "Estado"], abnormal.slice(0, 30).map((item) => [
        patientLabel(bundle, item.patient_id),
        item.marker_name,
        item.category,
        `${valueLabel(item.value)} ${item.unit}`,
        valueLabel(item.delta_value),
        presentLabStatus(item.status),
      ]), "No hay marcadores alterados."),
      table("Tendencias por marcador", ["Paciente", "Marcador", "Último resultado", "Históricos"], latestLabRows(bundle).map((item) => [
        patientLabel(bundle, item.patient_id),
        item.marker_name,
        formatDate(item.resulted_at),
        String(bundle.labResults.filter((row) => row.patient_id === item.patient_id && row.marker_code === item.marker_code).length),
      ]), "No hay tendencia longitudinal disponible."),
    ],
  });
}

function buildAgendaPreview(context: BuildContext): ReportPreview {
  const { bundle, parameters } = context;
  const appointments = applyPeriod(bundle.appointments, parameters, "starts_at");

  return basePreview(context, {
    metrics: [
      metric("Citas", String(appointments.length), periodLabel(parameters.period), "cyan"),
      metric("Programadas", String(appointments.filter((item) => item.status === "scheduled").length), "Pendientes", "yellow"),
      metric("Completadas", String(appointments.filter((item) => item.status === "completed").length), "Atendidas", "green"),
      metric("Canceladas", String(appointments.filter((item) => item.status === "cancelled").length), "Cancelaciones", "orange"),
      metric("No asistió", String(appointments.filter((item) => item.status === "no_show").length), "Inasistencias", "red"),
    ],
    sections: [
      section("Distribución", [
        `Telemedicina: ${appointments.filter((item) => item.appointment_type === "telemedicina" || item.modality === "telemedicina").length}`,
        `Control de laboratorios: ${appointments.filter((item) => item.appointment_type === "control_labs").length}`,
      ]),
    ],
    tables: [
      table("Agenda del periodo", ["Paciente", "Tipo", "Estado", "Fecha", "Ubicación"], appointments.slice(0, 30).map((item) => [
        patientLabel(bundle, item.patient_id),
        presentAppointmentType(item.appointment_type),
        presentStatus(item.status),
        formatDateTime(item.starts_at),
        item.location ?? item.modality ?? "Sin ubicación",
      ]), "No hay citas para este periodo."),
    ],
  });
}

function buildOperationalNutritionPreview(context: BuildContext): ReportPreview {
  const { bundle } = context;
  const activeMenus = bundle.weeklyMenus.filter((item) => item.status === "active");
  const closedMenus = bundle.weeklyMenus.filter((item) => item.status === "closed");

  return basePreview(context, {
    metrics: [
      metric("Alimentos", String(bundle.foodItems.length), "Globales + tenant", "cyan"),
      metric("Recetas", String(bundle.recipes.length), "Preparaciones", "green"),
      metric("Menús semanales", String(bundle.weeklyMenus.length), "Planificación", "yellow"),
      metric("Menús activos/cerrados", `${activeMenus.length}/${closedMenus.length}`, "Activos / cerrados", "cyan"),
      metric("Items planificados", String(bundle.weeklyMenuItems.length), "Recetas o alimentos", "green"),
    ],
    sections: [
      section("Cobertura nutricional", [
        `Alimentos institucionales: ${bundle.foodItems.filter((item) => item.tenant_id).length}`,
        `Alimentos globales: ${bundle.foodItems.filter((item) => !item.tenant_id).length}`,
        `Recetas activas: ${bundle.recipes.filter((item) => item.status === "active").length}`,
      ]),
    ],
    tables: [
      table("Menús semanales", ["Paciente", "Nombre", "Semana", "Estado", "Meta kcal"], bundle.weeklyMenus.map((item) => [
        patientLabel(bundle, item.patient_id),
        item.name,
        item.week_start,
        presentStatus(item.status),
        valueLabel(item.kcal_target),
      ]), "No hay menús semanales registrados."),
      table("Recetas", ["Receta", "Categoría", "Estado", "Porciones"], bundle.recipes.map((item) => [
        item.name,
        item.category ?? "Sin categoría",
        presentStatus(item.status),
        valueLabel(item.portions),
      ]), "No hay recetas registradas."),
    ],
  });
}

function buildPlansPreview(context: BuildContext): ReportPreview {
  const { bundle, parameters } = context;
  const plans = applyPeriod(bundle.plans, parameters, "created_at");

  return basePreview(context, {
    metrics: [
      metric("Planes", String(plans.length), periodLabel(parameters.period), "cyan"),
      metric("Activos", String(plans.filter((item) => ["active", "approved"].includes(item.status)).length), "Seguimiento", "green"),
      metric("Borradores", String(plans.filter((item) => item.status === "draft").length), "Pendientes", "yellow"),
      metric("Cerrados", String(plans.filter((item) => item.status === "closed").length), "Finalizados", "muted"),
    ],
    sections: [section("Lectura de prescripción", [`Kcal promedio: ${average(plans.map((plan) => toNumber(plan.kcal))).toFixed(0)}`, `Planes con restricciones: ${plans.filter((plan) => (plan.restrictions ?? []).length > 0).length}`])],
    tables: [
      table("Planes nutricionales", ["Paciente", "Tipo", "Estado", "Kcal", "Proteína", "Dieta"], plans.map((item) => [
        patientLabel(bundle, item.patient_id),
        item.type,
        presentStatus(item.status),
        valueLabel(item.kcal),
        `${valueLabel(item.protein_g)} g`,
        item.diet ?? "Sin dieta",
      ]), "No hay planes nutricionales en el periodo."),
    ],
  });
}

function buildAlertsPreview(context: BuildContext): ReportPreview {
  const { bundle } = context;
  const labAlerts = bundle.labResults.filter((item) => item.status === "critical" || item.status === "out_of_range");
  const resolved = bundle.alertAcknowledgements.filter((item) => item.status === "resolved");

  return basePreview(context, {
    metrics: [
      metric("Alertas registradas", String(bundle.alertAcknowledgements.length), "Persistidas", "cyan"),
      metric("Resueltas", String(resolved.length), "Cierre clínico", "green"),
      metric("Labs críticos", String(labAlerts.filter((item) => item.status === "critical").length), "Derivadas de labs", "red"),
      metric("Labs fuera de rango", String(labAlerts.filter((item) => item.status === "out_of_range").length), "Derivadas de labs", "orange"),
    ],
    sections: [section("Base de alertas", ["Incluye estados persistidos en alert_acknowledgements y alertas derivadas desde lab_results."])],
    tables: [
      table("Alertas persistidas", ["Paciente", "Origen", "Prioridad", "Estado", "Fecha"], bundle.alertAcknowledgements.map((item) => [
        item.patient_id ? patientLabel(bundle, item.patient_id) : "Sin paciente",
        item.source_type ?? item.alert_id,
        item.priority ?? "Sin prioridad",
        presentStatus(item.status),
        formatDateTime(item.updated_at),
      ]), "No hay alertas persistidas."),
      table("Alertas derivadas de laboratorio", ["Paciente", "Marcador", "Estado", "Valor", "Fecha"], labAlerts.slice(0, 20).map((item) => [
        patientLabel(bundle, item.patient_id),
        item.marker_name,
        presentLabStatus(item.status),
        `${valueLabel(item.value)} ${item.unit}`,
        formatDate(item.resulted_at),
      ]), "No hay alertas derivadas de laboratorio."),
    ],
  });
}

function buildCcorpPreview(context: BuildContext): ReportPreview {
  const { bundle } = context;
  const resultByAssessment = new Map(bundle.ccorpResults.map((result) => [result.assessment_id, result]));

  return basePreview(context, {
    metrics: [
      metric("Evaluaciones CCORP", String(bundle.ccorpAssessments.length), "Nivel 1", "cyan"),
      metric("Con resultados", String(bundle.ccorpAssessments.filter((item) => resultByAssessment.has(item.id)).length), "Cálculos guardados", "green"),
      metric("Pacientes", String(new Set(bundle.ccorpAssessments.map((item) => item.patient_id)).size), "Únicos", "yellow"),
    ],
    sections: [section("Composición corporal", ["Datos provenientes de ccorp_level1_assessments y ccorp_level1_results."])],
    tables: [
      table("Evaluaciones CCORP", ["Paciente", "Fecha", "IMC", "% graso", "Masa grasa"], bundle.ccorpAssessments.map((item) => {
        const result = resultByAssessment.get(item.id);
        return [
          patientLabel(bundle, item.patient_id),
          formatDate(item.measured_at),
          valueLabel(result?.bmi),
          valueLabel(result?.durnin_body_fat_percent),
          valueLabel(result?.durnin_fat_mass_kg),
        ];
      }), "No hay evaluaciones CCORP registradas."),
    ],
  });
}

function buildRecipesPreview(context: BuildContext): ReportPreview {
  const { bundle } = context;

  return basePreview(context, {
    metrics: [
      metric("Recetas", String(bundle.recipes.length), "Tenant", "cyan"),
      metric("Activas", String(bundle.recipes.filter((item) => item.status === "active").length), "Disponibles", "green"),
      metric("Archivadas", String(bundle.recipes.filter((item) => item.status === "archived").length), "No disponibles", "muted"),
    ],
    sections: [section("Uso operativo", [`Menús que usan recetas/alimentos: ${bundle.weeklyMenuItems.length}`])],
    tables: [
      table("Recetas", ["Nombre", "Categoría", "Estado", "Porciones", "Creación"], bundle.recipes.map((item) => [
        item.name,
        item.category ?? "Sin categoría",
        presentStatus(item.status),
        valueLabel(item.portions),
        formatDate(item.created_at),
      ]), "No hay recetas registradas."),
    ],
  });
}

function buildSportsPerformancePreview(context: BuildContext): ReportPreview {
  const { bundle, parameters } = context;
  const patientId = parameters.patientId ?? null;
  const profiles = bundle.sportsProfiles.filter((item) => !patientId || item.patient_id === patientId);
  const assessments = applyPeriod(bundle.sportsBodycompSnapshots, parameters, "measured_at").filter((item) => !patientId || item.patient_id === patientId);
  const readyAssessments = assessments.filter((item) => sportsSomatotype(item).status === "ready");
  const patientsWithSportsData = new Set([...profiles.map((item) => item.patient_id), ...assessments.map((item) => item.patient_id)]).size;

  return basePreview(context, {
    metrics: [
      metric("Perfiles deportivos", String(profiles.length), patientId ? "Paciente seleccionado" : "Tenant", "cyan"),
      metric("Evaluaciones", String(assessments.length), periodLabel(parameters.period), "green"),
      metric("Somatotipos listos", String(readyAssessments.length), "Con endo/meso/ecto completos", "yellow"),
      metric("Pacientes", String(patientsWithSportsData), "Con datos deportivos", "muted"),
    ],
    sections: [
      section("Alcance conservador", [
        "El reporte usa perfiles deportivos y evaluaciones de composición corporal persistidas.",
        "No emite diagnóstico médico ni inventa somatotipos: si faltan endomorfia, mesomorfia o ectomorfia, la sección queda como datos insuficientes.",
      ]),
      ...(readyAssessments.length === 0
        ? [section("Datos insuficientes", ["No hay evaluaciones con componentes antropométricos completos para graficar o etiquetar somatocarta."])]
        : []),
    ],
    tables: [
      table("Perfiles deportivos", ["Paciente", "Disciplina", "Nivel", "Posición", "Objetivo"], profiles.map((item) => [
        patientLabel(bundle, item.patient_id),
        item.discipline,
        item.category,
        item.position ?? "--",
        item.objective ?? "Sin objetivo registrado",
      ]), "No hay perfiles deportivos registrados."),
      table("Evaluaciones deportivas", ["Paciente", "Fecha", "% grasa", "Masa magra", "Músculo", "Somatotipo", "Notas"], assessments.map((item) => {
        const somatotype = sportsSomatotype(item);
        return [
          patientLabel(bundle, item.patient_id),
          formatDate(item.measured_at),
          valueLabel(item.fat_pct),
          valueLabel(item.lean_mass_kg),
          valueLabel(item.skeletal_muscle_kg),
          somatotype.status === "ready" ? `${valueLabel(somatotype.endomorphy)}-${valueLabel(somatotype.mesomorphy)}-${valueLabel(somatotype.ectomorphy)} · ${somatotype.label ?? "Somatotipo"}` : "Datos insuficientes",
          item.notes ?? "--",
        ];
      }), "No hay evaluaciones deportivas en el periodo."),
      table("Somatocarta", ["Paciente", "Fecha", "X", "Y", "Interpretación"], readyAssessments.map((item) => {
        const somatotype = sportsSomatotype(item);
        return [
          patientLabel(bundle, item.patient_id),
          formatDate(item.measured_at),
          valueLabel(somatotype.x),
          valueLabel(somatotype.y),
          somatotype.label ?? "Somatotipo calculado",
        ];
      }), "No hay puntos reales suficientes para somatocarta."),
    ],
  });
}

function buildPediatricPreview(context: BuildContext): ReportPreview {
  return basePreview(context, {
    metrics: [metric("Estado", "Próximamente", "Requiere módulo pediátrico completo", "muted")],
    sections: [section("Alcance pendiente", ["Este reporte se habilitará cuando Pediatría avanzada tenga referencias reales, z-score, percentiles e historial longitudinal."])],
    tables: [],
  });
}

function basePreview(context: BuildContext, body: { metrics: ReportMetric[]; sections: ReportSection[]; tables: ReportTable[] }): ReportPreview {
  return {
    reportType: context.template.type,
    title: context.template.title,
    category: context.template.category,
    generatedAt: new Date().toISOString(),
    periodLabel: periodLabel(context.parameters.period),
    patientLabel: context.patient ? `${patientName(context.patient)} · ${context.patient.mrn}` : null,
    filters: context.parameters,
    availability: context.availability,
    metrics: body.metrics,
    sections: [
      ...body.sections,
      ...((context.bundle.warnings ?? []).length
        ? [section("Fuentes con advertencia", context.bundle.warnings)]
        : []),
    ],
    tables: body.tables,
    warnings: context.bundle.warnings ?? [],
  };
}

function resolveAvailability(template: ReportTemplate, bundle: ReportDataBundle, parameters: ReportParameters): ReportAvailability {
  if (template.type === "pediatric") {
    return { status: "soon", label: "Próximamente", reason: "Requiere módulo pediátrico completo con referencias reales." };
  }
  if (template.type === "patient_clinical" && !parameters.patientId) {
    return { status: "requires_patient", label: "Requiere paciente", reason: "Selecciona un paciente real para este reporte." };
  }

  const dataCountByType: Record<ReportType, number> = {
    executive: bundle.patients.length + bundle.assessments.length + bundle.labResults.length + bundle.appointments.length,
    patient_clinical: parameters.patientId ? 1 : 0,
    anthropometry: bundle.ccorpAssessments.length,
    labs: bundle.labResults.length,
    plans: bundle.plans.length,
    alerts: bundle.alertAcknowledgements.length + bundle.labResults.filter((item) => item.status !== "ok").length,
    agenda: bundle.appointments.length,
    operational_nutrition: bundle.foodItems.length + bundle.recipes.length + bundle.weeklyMenus.length,
    recipes: bundle.recipes.length,
    ccorp: bundle.ccorpAssessments.length,
    sports_performance: parameters.patientId
      ? bundle.sportsProfiles.filter((item) => item.patient_id === parameters.patientId).length +
        bundle.sportsBodycompSnapshots.filter((item) => item.patient_id === parameters.patientId).length
      : bundle.sportsProfiles.length + bundle.sportsBodycompSnapshots.length,
    pediatric: 0,
  };

  if ((dataCountByType[template.type] ?? 0) === 0) {
    return { status: "requires_data", label: "Requiere datos", reason: "No hay datos reales suficientes para generar este reporte." };
  }

  return { status: "available", label: "Disponible", reason: "Listo para vista previa y generación con datos reales." };
}

type BuildContext = {
  bundle: ReportDataBundle;
  template: ReportTemplate;
  parameters: ReportParameters;
  availability: ReportAvailability;
  patient: PatientRow | null;
};

async function readRows<T>(label: string, query: SupabaseQueryBuilder<T>, warnings: string[]): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message) : "error desconocido";
    warnings.push(`${label}: ${message}`);
    return [];
  }
}

async function currentUserId() {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Sesión requerida para generar reportes.");
  return data.user.id;
}

function mapReportRun(row: ReportRunRow): ReportRunSummary {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    reportType: row.report_type,
    reportTitle: row.report_name,
    format: row.format,
    status: row.status,
    filters: row.filters,
    payload: row.payload,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function table(title: string, columns: string[], rows: string[][], emptyText: string): ReportTable {
  return { title, columns, rows, emptyText };
}

function section(title: string, items: string[]): ReportSection {
  return { title, items };
}

function metric(label: string, value: string, detail?: string, tone: ReportMetric["tone"] = "cyan"): ReportMetric {
  return { label, value, detail, tone };
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function valueLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
  }
  return String(value);
}

function patientName(patient: PatientRow) {
  return `${patient.first_name} ${patient.last_name}`.trim();
}

function patientLabel(bundle: ReportDataBundle, patientId: string) {
  const patient = bundle.patients.find((item) => item.id === patientId);
  return patient ? `${patientName(patient)} · ${patient.mrn}` : patientId;
}

function riskPatients(bundle: ReportDataBundle) {
  return bundle.patients.filter((patient) => ["high", "critical"].includes(patient.risk_level)).slice(0, 12);
}

function latestLabRows(bundle: ReportDataBundle) {
  const seen = new Set<string>();
  return bundle.labResults.filter((item) => {
    const key = `${item.patient_id}:${item.marker_code}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

function sportsSomatotype(row: SportsBodycompSnapshotRow) {
  return calculateSomatotype({
    endomorphy: toNullableNumber(row.endomorphy),
    mesomorphy: toNullableNumber(row.mesomorphy),
    ectomorphy: toNullableNumber(row.ectomorphy),
  });
}

function average(values: number[]) {
  const filtered = values.filter((value) => value > 0);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function appointmentStatusSummary(rows: AppointmentRow[]) {
  const completed = rows.filter((item) => item.status === "completed").length;
  const scheduled = rows.filter((item) => item.status === "scheduled").length;
  return `${scheduled} programadas · ${completed} completadas`;
}

function applyPeriod<T extends Record<string, unknown>>(rows: T[], parameters: ReportParameters, dateKey: keyof T) {
  if (parameters.period === "all") return rows;
  const start = periodStart(parameters.period);
  return rows.filter((row) => {
    const value = row[dateKey];
    if (!value) return false;
    return new Date(String(value)).getTime() >= start.getTime();
  });
}

function periodStart(period: ReportPeriod) {
  const now = new Date();
  if (period === "last_7_days") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === "last_30_days") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function periodLabel(period: ReportPeriod) {
  if (period === "last_7_days") return "Últimos 7 días";
  if (period === "last_30_days") return "Últimos 30 días";
  if (period === "this_month") return "Mes actual";
  return "Todo el historial";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("es-BO");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  return new Date(value).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" });
}

function presentRisk(value: string) {
  if (value === "critical") return "Crítico";
  if (value === "high") return "Alto";
  if (value === "moderate") return "Moderado";
  if (value === "low") return "Bajo";
  return presentStatus(value);
}

function presentLabStatus(value: string) {
  if (value === "ok") return "OK";
  if (value === "out_of_range") return "Fuera";
  if (value === "critical") return "Crítico";
  if (value === "pending") return "Pendiente";
  return presentStatus(value);
}

function presentEncounterType(value: string) {
  if (value === "admission") return "Internación";
  if (value === "outpatient") return "Consulta externa";
  if (value === "follow_up") return "Seguimiento";
  return presentStatus(value);
}

function presentAppointmentType(value: string) {
  if (value === "consulta") return "Consulta";
  if (value === "antropometria") return "Antropometría";
  if (value === "educacion") return "Educación";
  if (value === "telemedicina") return "Telemedicina";
  if (value === "seguimiento") return "Seguimiento";
  if (value === "control_labs") return "Control de laboratorios";
  return "Otro";
}

function presentStatus(value: string) {
  const labels: Record<string, string> = {
    active: "Activo",
    draft: "Borrador",
    completed: "Completado",
    cancelled: "Cancelado",
    closed: "Cerrado",
    open: "Abierto",
    pending: "Pendiente",
    reviewed: "Revisada",
    resolved: "Resuelta",
    silenced: "Silenciada",
    attended: "Atendida",
    scheduled: "Programada",
    no_show: "No asistió",
    approved: "Aprobado",
    archived: "Archivado",
  };
  return labels[value] ?? value.replace(/_/g, " ");
}
