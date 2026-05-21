import { supabase } from "@/integrations/supabase/client";
import { calculateEnteralPlanMetrics, type EnteralPlanMetrics } from "@/domain/clinical/enteralEngine";
import { writeAuditLog } from "@/services/clinicalService";

export interface SpecialtySourceResult<T> {
  source: "supabase" | "demo";
  data: T;
}

export interface PregnancyRecordSummary {
  id: string;
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  gestationalWeek: number;
  trimester: string;
  prePregnancyWeight: number | null;
  currentWeight: number | null;
  expectedGainMin: number | null;
  expectedGainMax: number | null;
  actualGain: number | null;
  flags: string[];
  measuredAt: string;
}

export interface EnteralDailyLogSummary {
  id: string;
  tenantId: string;
  planId: string;
  patientId: string | null;
  loggedAt: string;
  residualMl: number | null;
  deliveredVolumeMl: number | null;
  deliveredKcal: number | null;
  deliveredProteinG: number | null;
  gastricResidualMl: number | null;
  diarrhea: boolean;
  vomiting: boolean;
  distension: boolean;
  abdominalDistension: boolean;
  aspirationEvent: boolean;
  adherencePct: number | null;
  toleranceStatus: string | null;
  interruptions: string | null;
  observations: string | null;
  notes: string | null;
}

export interface EnteralPlanSummary {
  id: string;
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  nutritionPlanId: string | null;
  accessType: string;
  route: string;
  administrationMode: string;
  formulaName: string;
  formulaType: string | null;
  kcal: number | null;
  proteinG: number | null;
  volumeMl: number | null;
  rateMlH: number | null;
  flushWaterMl: number | null;
  targetKcal: number | null;
  targetProteinG: number | null;
  targetVolumeMl: number | null;
  infusionRateMlH: number | null;
  waterFlushMl: number | null;
  startDate: string | null;
  status: string;
  notes: string | null;
  toleranceStatus: string | null;
  complications: string[];
  createdAt: string;
  latestLog: EnteralDailyLogSummary | null;
  logs: EnteralDailyLogSummary[];
  metrics: EnteralPlanMetrics;
}

export interface ParenteralMonitoringLogSummary {
  id: string;
  tenantId: string;
  planId: string;
  patientId: string;
  loggedAt: string;
  glucoseMgDl: number | null;
  triglyceridesMgDl: number | null;
  liverNotes: string | null;
  catheterNotes: string | null;
  complications: string | null;
  notes: string | null;
}

export interface ParenteralPlanSummary {
  id: string;
  tenantId: string;
  patientId: string;
  startDate: string | null;
  status: string;
  totalVolumeMl: number | null;
  glucoseG: number | null;
  aminoAcidsG: number | null;
  lipidsG: number | null;
  electrolytesNotes: string | null;
  micronutrientsNotes: string | null;
  monitoringNotes: string | null;
  prescribingPhysician: string | null;
  createdAt: string;
  latestLog: ParenteralMonitoringLogSummary | null;
  logs: ParenteralMonitoringLogSummary[];
}

export interface SportsProfileSummary {
  id: string;
  tenantId: string;
  patientId: string;
  discipline: string;
  category: string;
  position: string | null;
  objective: string | null;
}

export interface SportsBodycompSnapshotSummary {
  id: string;
  tenantId: string;
  patientId: string;
  endomorphy: number | null;
  mesomorphy: number | null;
  ectomorphy: number | null;
  fatPct: number | null;
  leanMassKg: number | null;
  skeletalMuscleKg: number | null;
  notes: string | null;
  measuredAt: string;
}

export interface CreatePregnancyRecordInput {
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  gestationalWeek: number;
  trimester: string;
  prePregnancyWeight: number | null;
  currentWeight: number | null;
  expectedGainMin: number | null;
  expectedGainMax: number | null;
  actualGain: number | null;
  flags: string[];
  measuredAt: string;
}

export interface CreateEnteralPlanInput {
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  nutritionPlanId?: string | null;
  accessType: string;
  route?: string;
  administrationMode?: string;
  formulaName: string;
  formulaType?: string | null;
  kcal: number | null;
  proteinG: number | null;
  volumeMl: number | null;
  rateMlH: number | null;
  flushWaterMl: number | null;
  startDate?: string | null;
  status?: string;
  notes?: string | null;
  toleranceStatus: string | null;
  complications: string[];
  initialLog: {
    residualMl: number | null;
    deliveredVolumeMl?: number | null;
    deliveredKcal?: number | null;
    deliveredProteinG?: number | null;
    diarrhea: boolean;
    vomiting: boolean;
    distension: boolean;
    aspirationEvent?: boolean;
    adherencePct: number | null;
    observations: string | null;
    toleranceStatus?: string | null;
    interruptions?: string | null;
  };
}

export interface CreateEnteralDailyLogInput {
  tenantId: string;
  planId: string;
  residualMl: number | null;
  deliveredVolumeMl?: number | null;
  deliveredKcal?: number | null;
  deliveredProteinG?: number | null;
  diarrhea: boolean;
  vomiting: boolean;
  distension: boolean;
  aspirationEvent?: boolean;
  adherencePct: number | null;
  toleranceStatus?: string | null;
  interruptions?: string | null;
  observations: string | null;
  loggedAt: string;
}

export interface UpdateEnteralPlanInput extends Omit<CreateEnteralPlanInput, "initialLog"> {
  planId: string;
}

export interface UpdateEnteralPlanStatusInput {
  tenantId: string;
  planId: string;
  status: "active" | "paused" | "closed";
  notes?: string | null;
}

export interface CreateParenteralPlanInput {
  tenantId: string;
  patientId: string;
  startDate: string | null;
  status?: "draft" | "active" | "closed";
  totalVolumeMl: number | null;
  glucoseG: number | null;
  aminoAcidsG: number | null;
  lipidsG: number | null;
  electrolytesNotes: string | null;
  micronutrientsNotes: string | null;
  monitoringNotes: string | null;
  prescribingPhysician: string | null;
}

export interface UpdateParenteralPlanInput extends CreateParenteralPlanInput {
  planId: string;
}

export interface CreateParenteralMonitoringLogInput {
  tenantId: string;
  planId: string;
  glucoseMgDl: number | null;
  triglyceridesMgDl: number | null;
  liverNotes: string | null;
  catheterNotes: string | null;
  complications: string | null;
  notes: string | null;
  loggedAt: string;
}

export interface CreateSportsProfileInput {
  tenantId: string;
  patientId: string;
  discipline: string;
  category: string;
  position: string | null;
  objective: string | null;
}

export interface CreateSportsBodycompSnapshotInput {
  tenantId: string;
  patientId: string;
  endomorphy: number | null;
  mesomorphy: number | null;
  ectomorphy: number | null;
  fatPct: number | null;
  leanMassKg: number | null;
  skeletalMuscleKg: number | null;
  notes: string | null;
  measuredAt: string;
  profile: CreateSportsProfileInput;
}

async function hasRemoteSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

async function currentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function rowString(row: Record<string, unknown>, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function rowNullableString(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

function rowNumber(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rowBoolean(row: Record<string, unknown>, key: string) {
  return row[key] === true;
}

function rowStringArray(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapPregnancyRecord(row: Record<string, unknown>): PregnancyRecordSummary {
  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    patientId: rowString(row, "patient_id"),
    encounterId: rowNullableString(row, "encounter_id"),
    gestationalWeek: rowNumber(row, "gestational_week") ?? 0,
    trimester: rowString(row, "trimester"),
    prePregnancyWeight: rowNumber(row, "pre_pregnancy_weight"),
    currentWeight: rowNumber(row, "current_weight"),
    expectedGainMin: rowNumber(row, "expected_gain_min"),
    expectedGainMax: rowNumber(row, "expected_gain_max"),
    actualGain: rowNumber(row, "actual_gain"),
    flags: rowStringArray(row, "flags"),
    measuredAt: rowString(row, "measured_at"),
  };
}

function mapEnteralLog(row: Record<string, unknown>): EnteralDailyLogSummary {
  const residualMl = rowNumber(row, "gastric_residual_ml") ?? rowNumber(row, "residual_ml");
  const distension = rowBoolean(row, "abdominal_distension") || rowBoolean(row, "distension");
  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    planId: rowString(row, "plan_id"),
    patientId: rowNullableString(row, "patient_id"),
    loggedAt: rowString(row, "logged_at"),
    residualMl,
    deliveredVolumeMl: rowNumber(row, "delivered_volume_ml"),
    deliveredKcal: rowNumber(row, "delivered_kcal"),
    deliveredProteinG: rowNumber(row, "delivered_protein_g"),
    gastricResidualMl: residualMl,
    diarrhea: rowBoolean(row, "diarrhea"),
    vomiting: rowBoolean(row, "vomiting"),
    distension,
    abdominalDistension: distension,
    aspirationEvent: rowBoolean(row, "aspiration_event"),
    adherencePct: rowNumber(row, "adherence_pct"),
    toleranceStatus: rowNullableString(row, "tolerance_status"),
    interruptions: rowNullableString(row, "interruptions"),
    observations: rowNullableString(row, "observations") ?? rowNullableString(row, "notes"),
    notes: rowNullableString(row, "notes") ?? rowNullableString(row, "observations"),
  };
}

function mapEnteralPlan(row: Record<string, unknown>, logs: EnteralDailyLogSummary[] = []): EnteralPlanSummary {
  const latestLog = logs[0] ?? null;
  const targetVolumeMl = rowNumber(row, "target_volume_ml") ?? rowNumber(row, "volume_ml");
  const targetKcal = rowNumber(row, "target_kcal") ?? rowNumber(row, "kcal");
  const targetProteinG = rowNumber(row, "target_protein_g") ?? rowNumber(row, "protein_g");
  const route = rowString(row, "route") || rowString(row, "access_type");
  const metrics = calculateEnteralPlanMetrics({
    targetVolumeMl,
    targetKcal,
    targetProteinG,
    deliveredVolumeMl: latestLog?.deliveredVolumeMl ?? null,
    deliveredKcal: latestLog?.deliveredKcal ?? null,
    deliveredProteinG: latestLog?.deliveredProteinG ?? null,
    adherencePct: latestLog?.adherencePct ?? null,
    vomiting: latestLog?.vomiting ?? false,
    diarrhea: latestLog?.diarrhea ?? false,
    abdominalDistension: latestLog?.abdominalDistension ?? false,
    aspirationEvent: latestLog?.aspirationEvent ?? false,
    manualToleranceStatus: latestLog?.toleranceStatus ?? rowNullableString(row, "tolerance_status"),
  });

  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    patientId: rowString(row, "patient_id"),
    encounterId: rowNullableString(row, "encounter_id"),
    nutritionPlanId: rowNullableString(row, "nutrition_plan_id"),
    accessType: route,
    route,
    administrationMode: rowString(row, "administration_mode", "continua"),
    formulaName: rowString(row, "formula_name"),
    formulaType: rowNullableString(row, "formula_type"),
    kcal: targetKcal,
    proteinG: targetProteinG,
    volumeMl: targetVolumeMl,
    rateMlH: rowNumber(row, "infusion_rate_ml_h") ?? rowNumber(row, "rate_ml_h"),
    flushWaterMl: rowNumber(row, "water_flush_ml") ?? rowNumber(row, "flush_water_ml"),
    targetKcal,
    targetProteinG,
    targetVolumeMl,
    infusionRateMlH: rowNumber(row, "infusion_rate_ml_h") ?? rowNumber(row, "rate_ml_h"),
    waterFlushMl: rowNumber(row, "water_flush_ml") ?? rowNumber(row, "flush_water_ml"),
    startDate: rowNullableString(row, "start_date"),
    status: rowString(row, "status", "active"),
    notes: rowNullableString(row, "notes"),
    toleranceStatus: rowNullableString(row, "tolerance_status"),
    complications: rowStringArray(row, "complications"),
    createdAt: rowString(row, "created_at"),
    latestLog,
    logs,
    metrics,
  };
}

function mapParenteralLog(row: Record<string, unknown>): ParenteralMonitoringLogSummary {
  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    planId: rowString(row, "parenteral_plan_id"),
    patientId: rowString(row, "patient_id"),
    loggedAt: rowString(row, "logged_at"),
    glucoseMgDl: rowNumber(row, "glucose_mg_dl"),
    triglyceridesMgDl: rowNumber(row, "triglycerides_mg_dl"),
    liverNotes: rowNullableString(row, "liver_notes"),
    catheterNotes: rowNullableString(row, "catheter_notes"),
    complications: rowNullableString(row, "complications"),
    notes: rowNullableString(row, "notes"),
  };
}

function mapParenteralPlan(row: Record<string, unknown>, logs: ParenteralMonitoringLogSummary[] = []): ParenteralPlanSummary {
  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    patientId: rowString(row, "patient_id"),
    startDate: rowNullableString(row, "start_date"),
    status: rowString(row, "status", "draft"),
    totalVolumeMl: rowNumber(row, "total_volume_ml"),
    glucoseG: rowNumber(row, "glucose_g"),
    aminoAcidsG: rowNumber(row, "amino_acids_g"),
    lipidsG: rowNumber(row, "lipids_g"),
    electrolytesNotes: rowNullableString(row, "electrolytes_notes"),
    micronutrientsNotes: rowNullableString(row, "micronutrients_notes"),
    monitoringNotes: rowNullableString(row, "monitoring_notes"),
    prescribingPhysician: rowNullableString(row, "prescribing_physician"),
    createdAt: rowString(row, "created_at"),
    latestLog: logs[0] ?? null,
    logs,
  };
}

function mapSportsProfile(row: Record<string, unknown>): SportsProfileSummary {
  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    patientId: rowString(row, "patient_id"),
    discipline: rowString(row, "discipline"),
    category: rowString(row, "category"),
    position: rowNullableString(row, "position"),
    objective: rowNullableString(row, "objective"),
  };
}

function mapSportsSnapshot(row: Record<string, unknown>): SportsBodycompSnapshotSummary {
  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    patientId: rowString(row, "patient_id"),
    endomorphy: rowNumber(row, "endomorphy"),
    mesomorphy: rowNumber(row, "mesomorphy"),
    ectomorphy: rowNumber(row, "ectomorphy"),
    fatPct: rowNumber(row, "fat_pct"),
    leanMassKg: rowNumber(row, "lean_mass_kg"),
    skeletalMuscleKg: rowNumber(row, "skeletal_muscle_kg"),
    notes: rowNullableString(row, "notes"),
    measuredAt: rowString(row, "measured_at"),
  };
}

export async function getPregnancyRecordsForTenant(tenantId: string | null): Promise<SpecialtySourceResult<PregnancyRecordSummary[]>> {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return { source: "demo", data: [] };
  }

  const { data, error } = await supabase
    .from("pregnancy_records")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("measured_at", { ascending: false });

  if (error || !data) {
    throw error ?? new Error("No se pudieron cargar controles gineco-obstétricos.");
  }

  return { source: "supabase", data: data.map((row) => mapPregnancyRecord(row)) };
}

export async function getEnteralCareForTenant(tenantId: string | null): Promise<SpecialtySourceResult<EnteralPlanSummary[]>> {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return { source: "demo", data: [] };
  }

  const [plans, logs] = await Promise.all([
    supabase.from("enteral_plans").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase.from("enteral_daily_logs").select("*").eq("tenant_id", tenantId).order("logged_at", { ascending: false }),
  ]);

  if (plans.error || logs.error) {
    throw plans.error ?? logs.error ?? new Error("No se pudo cargar soporte enteral.");
  }

  const mappedLogs = (logs.data ?? []).map((row) => mapEnteralLog(row));
  const logsByPlan = new Map<string, EnteralDailyLogSummary[]>();
  for (const log of mappedLogs) {
    logsByPlan.set(log.planId, [...(logsByPlan.get(log.planId) ?? []), log]);
  }

  return {
    source: "supabase",
    data: (plans.data ?? [])
      .filter((row) => rowNullableString(row, "deleted_at") == null)
      .map((row) => mapEnteralPlan(row, logsByPlan.get(rowString(row, "id")) ?? [])),
  };
}

export async function getParenteralCareForTenant(tenantId: string | null): Promise<SpecialtySourceResult<ParenteralPlanSummary[]>> {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return { source: "demo", data: [] };
  }

  const [plans, logs] = await Promise.all([
    supabase.from("parenteral_plans").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase.from("parenteral_monitoring_logs").select("*").eq("tenant_id", tenantId).order("logged_at", { ascending: false }),
  ]);

  if (plans.error || logs.error) {
    throw plans.error ?? logs.error ?? new Error("No se pudo cargar soporte parenteral.");
  }

  const mappedLogs = (logs.data ?? []).map((row) => mapParenteralLog(row));
  const logsByPlan = new Map<string, ParenteralMonitoringLogSummary[]>();
  for (const log of mappedLogs) {
    logsByPlan.set(log.planId, [...(logsByPlan.get(log.planId) ?? []), log]);
  }

  return {
    source: "supabase",
    data: (plans.data ?? [])
      .filter((row) => rowNullableString(row, "deleted_at") == null)
      .map((row) => mapParenteralPlan(row, logsByPlan.get(rowString(row, "id")) ?? [])),
  };
}

export async function getSportsPerformanceForTenant(tenantId: string | null): Promise<
  SpecialtySourceResult<{
    profiles: SportsProfileSummary[];
    snapshots: SportsBodycompSnapshotSummary[];
  }>
> {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return { source: "demo", data: { profiles: [], snapshots: [] } };
  }

  const [profiles, snapshots] = await Promise.all([
    supabase.from("sports_profiles").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase.from("sports_bodycomp_snapshots").select("*").eq("tenant_id", tenantId).order("measured_at", { ascending: false }),
  ]);

  if (profiles.error || snapshots.error) {
    throw profiles.error ?? snapshots.error ?? new Error("No se pudo cargar rendimiento deportivo.");
  }

  return {
    source: "supabase",
    data: {
      profiles: (profiles.data ?? []).map((row) => mapSportsProfile(row)),
      snapshots: (snapshots.data ?? []).map((row) => mapSportsSnapshot(row)),
    },
  };
}

function requireSupabaseWrite(tenantId: string) {
  if (!supabase) {
    throw new Error("Supabase no esta configurado.");
  }
  if (!tenantId) {
    throw new Error("No hay tenant activo para guardar el registro.");
  }
}

function assertPatient(patientId: string) {
  if (!patientId) {
    throw new Error("Selecciona un paciente antes de guardar.");
  }
}

export async function createPregnancyRecord(input: CreatePregnancyRecordInput) {
  requireSupabaseWrite(input.tenantId);
  assertPatient(input.patientId);
  if (!Number.isInteger(input.gestationalWeek) || input.gestationalWeek < 1 || input.gestationalWeek > 45) {
    throw new Error("La semana gestacional debe estar entre 1 y 45.");
  }

  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("pregnancy_records")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      gestational_week: input.gestationalWeek,
      trimester: input.trimester,
      pre_pregnancy_weight: input.prePregnancyWeight ?? null,
      current_weight: input.currentWeight ?? null,
      expected_gain_min: input.expectedGainMin ?? null,
      expected_gain_max: input.expectedGainMax ?? null,
      actual_gain: input.actualGain ?? null,
      flags: input.flags ?? [],
      measured_at: input.measuredAt ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo guardar el control gineco-obstétrico.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "pregnancy_record.create",
    entityType: "pregnancy_records",
    entityId: rowString(data, "id"),
    afterData: {
      patient_id: input.patientId,
      gestational_week: input.gestationalWeek,
      current_weight: input.currentWeight ?? null,
    },
  });

  return mapPregnancyRecord(data);
}

export async function createEnteralDailyLog(input: CreateEnteralDailyLogInput) {
  requireSupabaseWrite(input.tenantId);
  if (!input.planId) {
    throw new Error("Selecciona un plan enteral antes de registrar tolerancia.");
  }

  const actorUserId = await currentUserId();
  const { data: planRow, error: planError } = await supabase
    .from("enteral_plans")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .maybeSingle();

  if (planError || !planRow) {
    throw planError ?? new Error("No se encontro el plan enteral seleccionado.");
  }

  const { data, error } = await supabase
    .from("enteral_daily_logs")
    .insert({
      tenant_id: input.tenantId,
      plan_id: input.planId,
      patient_id: rowString(planRow, "patient_id"),
      logged_at: input.loggedAt ?? new Date().toISOString(),
      residual_ml: input.residualMl ?? null,
      gastric_residual_ml: input.residualMl ?? null,
      delivered_volume_ml: input.deliveredVolumeMl ?? null,
      delivered_kcal: input.deliveredKcal ?? null,
      delivered_protein_g: input.deliveredProteinG ?? null,
      diarrhea: input.diarrhea ?? false,
      vomiting: input.vomiting ?? false,
      distension: input.distension ?? false,
      abdominal_distension: input.distension ?? false,
      aspiration_event: input.aspirationEvent ?? false,
      adherence_pct: input.adherencePct ?? null,
      tolerance_status: input.toleranceStatus ?? null,
      interruptions: input.interruptions ?? null,
      observations: input.observations ?? null,
      notes: input.observations ?? null,
      created_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo guardar el control diario enteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "enteral_daily_log.create",
    entityType: "enteral_daily_logs",
    entityId: rowString(data, "id"),
    afterData: {
      plan_id: input.planId,
      patient_id: rowString(planRow, "patient_id"),
      residual_ml: input.residualMl ?? null,
      delivered_volume_ml: input.deliveredVolumeMl ?? null,
      adherence_pct: input.adherencePct ?? null,
      tolerance_status: input.toleranceStatus ?? null,
    },
  });

  return mapEnteralLog(data);
}

export async function createEnteralPlan(input: CreateEnteralPlanInput) {
  requireSupabaseWrite(input.tenantId);
  assertPatient(input.patientId);
  if (!input.accessType.trim()) {
    throw new Error("Indica el tipo de acceso enteral.");
  }
  if (!input.formulaName.trim()) {
    throw new Error("Indica la formula enteral.");
  }

  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("enteral_plans")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      nutrition_plan_id: input.nutritionPlanId ?? null,
      access_type: input.accessType.trim(),
      route: input.route?.trim() || input.accessType.trim(),
      administration_mode: input.administrationMode ?? "continua",
      formula_name: input.formulaName.trim(),
      formula_type: input.formulaType?.trim() || null,
      kcal: input.kcal ?? null,
      protein_g: input.proteinG ?? null,
      volume_ml: input.volumeMl ?? null,
      rate_ml_h: input.rateMlH ?? null,
      flush_water_ml: input.flushWaterMl ?? null,
      target_kcal: input.kcal ?? null,
      target_protein_g: input.proteinG ?? null,
      target_volume_ml: input.volumeMl ?? null,
      infusion_rate_ml_h: input.rateMlH ?? null,
      water_flush_ml: input.flushWaterMl ?? null,
      start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? "active",
      notes: input.notes ?? null,
      schedule: [],
      tolerance_status: input.toleranceStatus ?? null,
      complications: input.complications ?? [],
      created_by: actorUserId,
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo guardar el plan enteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "enteral_plan.create",
    entityType: "enteral_plans",
    entityId: rowString(data, "id"),
    afterData: {
      patient_id: input.patientId,
      formula_name: input.formulaName,
      volume_ml: input.volumeMl ?? null,
      rate_ml_h: input.rateMlH ?? null,
      status: input.status ?? "active",
    },
  });

  const latestLog = input.initialLog
    ? await createEnteralDailyLog({
        tenantId: input.tenantId,
        planId: rowString(data, "id"),
        loggedAt: new Date().toISOString(),
        ...input.initialLog,
      })
    : null;

  return mapEnteralPlan(data, latestLog ? [latestLog] : []);
}

export async function updateEnteralPlan(input: UpdateEnteralPlanInput) {
  requireSupabaseWrite(input.tenantId);
  assertPatient(input.patientId);
  if (!input.planId) {
    throw new Error("Selecciona un plan enteral para editar.");
  }
  if (!input.accessType.trim()) {
    throw new Error("Indica el tipo de acceso enteral.");
  }
  if (!input.formulaName.trim()) {
    throw new Error("Indica la formula enteral.");
  }

  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase
    .from("enteral_plans")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("enteral_plans")
    .update({
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      nutrition_plan_id: input.nutritionPlanId ?? null,
      access_type: input.accessType.trim(),
      route: input.route?.trim() || input.accessType.trim(),
      administration_mode: input.administrationMode ?? "continua",
      formula_name: input.formulaName.trim(),
      formula_type: input.formulaType?.trim() || null,
      kcal: input.kcal ?? null,
      protein_g: input.proteinG ?? null,
      volume_ml: input.volumeMl ?? null,
      rate_ml_h: input.rateMlH ?? null,
      flush_water_ml: input.flushWaterMl ?? null,
      target_kcal: input.kcal ?? null,
      target_protein_g: input.proteinG ?? null,
      target_volume_ml: input.volumeMl ?? null,
      infusion_rate_ml_h: input.rateMlH ?? null,
      water_flush_ml: input.flushWaterMl ?? null,
      start_date: input.startDate ?? null,
      status: input.status ?? "active",
      notes: input.notes ?? null,
      tolerance_status: input.toleranceStatus ?? null,
      complications: input.complications ?? [],
      updated_by: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo actualizar el plan enteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "enteral_plan.update",
    entityType: "enteral_plans",
    entityId: rowString(data, "id"),
    beforeData: beforeData ?? null,
    afterData: {
      patient_id: input.patientId,
      formula_name: input.formulaName,
      target_volume_ml: input.volumeMl ?? null,
      status: input.status ?? "active",
    },
  });

  return mapEnteralPlan(data, []);
}

export async function updateEnteralPlanStatus(input: UpdateEnteralPlanStatusInput) {
  requireSupabaseWrite(input.tenantId);
  if (!input.planId) {
    throw new Error("Selecciona un plan enteral.");
  }

  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase
    .from("enteral_plans")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("enteral_plans")
    .update({
      status: input.status,
      notes: input.notes ?? rowNullableString(beforeData ?? {}, "notes"),
      updated_by: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo cambiar el estado del plan enteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType:
      input.status === "paused"
        ? "enteral_plan.paused"
        : input.status === "closed"
          ? "enteral_plan.closed"
          : "enteral_plan.update",
    entityType: "enteral_plans",
    entityId: rowString(data, "id"),
    beforeData: beforeData ?? null,
    afterData: { status: input.status, notes: input.notes ?? null },
  });

  return mapEnteralPlan(data, []);
}

export async function auditEnteralReportExport(input: { tenantId: string; planId: string; format: "pdf" | "print" }) {
  requireSupabaseWrite(input.tenantId);
  const actorUserId = await currentUserId();
  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "enteral_report.exported",
    entityType: "enteral_plans",
    entityId: input.planId,
    afterData: {
      format: input.format,
    },
  });
}

export async function createParenteralPlan(input: CreateParenteralPlanInput) {
  requireSupabaseWrite(input.tenantId);
  assertPatient(input.patientId);

  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("parenteral_plans")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      start_date: input.startDate ?? new Date().toISOString().slice(0, 10),
      status: input.status ?? "draft",
      total_volume_ml: input.totalVolumeMl ?? null,
      glucose_g: input.glucoseG ?? null,
      amino_acids_g: input.aminoAcidsG ?? null,
      lipids_g: input.lipidsG ?? null,
      electrolytes_notes: input.electrolytesNotes ?? null,
      micronutrients_notes: input.micronutrientsNotes ?? null,
      monitoring_notes: input.monitoringNotes ?? null,
      prescribing_physician: input.prescribingPhysician ?? null,
      created_by: actorUserId,
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo guardar el plan parenteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "parenteral_plan.create",
    entityType: "parenteral_plans",
    entityId: rowString(data, "id"),
    afterData: {
      patient_id: input.patientId,
      status: input.status ?? "draft",
      total_volume_ml: input.totalVolumeMl ?? null,
      glucose_g: input.glucoseG ?? null,
      amino_acids_g: input.aminoAcidsG ?? null,
      lipids_g: input.lipidsG ?? null,
    },
  });

  return mapParenteralPlan(data, []);
}

export async function updateParenteralPlan(input: UpdateParenteralPlanInput) {
  requireSupabaseWrite(input.tenantId);
  assertPatient(input.patientId);
  if (!input.planId) {
    throw new Error("Selecciona un plan parenteral para editar.");
  }

  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase
    .from("parenteral_plans")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("parenteral_plans")
    .update({
      patient_id: input.patientId,
      start_date: input.startDate ?? null,
      status: input.status ?? "draft",
      total_volume_ml: input.totalVolumeMl ?? null,
      glucose_g: input.glucoseG ?? null,
      amino_acids_g: input.aminoAcidsG ?? null,
      lipids_g: input.lipidsG ?? null,
      electrolytes_notes: input.electrolytesNotes ?? null,
      micronutrients_notes: input.micronutrientsNotes ?? null,
      monitoring_notes: input.monitoringNotes ?? null,
      prescribing_physician: input.prescribingPhysician ?? null,
      updated_by: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo actualizar el plan parenteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "parenteral_plan.update",
    entityType: "parenteral_plans",
    entityId: rowString(data, "id"),
    beforeData: beforeData ?? null,
    afterData: {
      patient_id: input.patientId,
      status: input.status ?? "draft",
      total_volume_ml: input.totalVolumeMl ?? null,
    },
  });

  return mapParenteralPlan(data, []);
}

export async function createParenteralMonitoringLog(input: CreateParenteralMonitoringLogInput) {
  requireSupabaseWrite(input.tenantId);
  if (!input.planId) {
    throw new Error("Selecciona un plan parenteral antes de registrar monitoreo.");
  }

  const actorUserId = await currentUserId();
  const { data: planRow, error: planError } = await supabase
    .from("parenteral_plans")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .maybeSingle();

  if (planError || !planRow) {
    throw planError ?? new Error("No se encontro el plan parenteral seleccionado.");
  }

  const { data, error } = await supabase
    .from("parenteral_monitoring_logs")
    .insert({
      tenant_id: input.tenantId,
      parenteral_plan_id: input.planId,
      patient_id: rowString(planRow, "patient_id"),
      logged_at: input.loggedAt ?? new Date().toISOString(),
      glucose_mg_dl: input.glucoseMgDl ?? null,
      triglycerides_mg_dl: input.triglyceridesMgDl ?? null,
      liver_notes: input.liverNotes ?? null,
      catheter_notes: input.catheterNotes ?? null,
      complications: input.complications ?? null,
      notes: input.notes ?? null,
      created_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo guardar el monitoreo parenteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "parenteral_log.create",
    entityType: "parenteral_monitoring_logs",
    entityId: rowString(data, "id"),
    afterData: {
      parenteral_plan_id: input.planId,
      patient_id: rowString(planRow, "patient_id"),
      glucose_mg_dl: input.glucoseMgDl ?? null,
      triglycerides_mg_dl: input.triglyceridesMgDl ?? null,
      complications: input.complications ?? null,
    },
  });

  return mapParenteralLog(data);
}

export async function closeParenteralPlan(input: { tenantId: string; planId: string; notes?: string | null }) {
  requireSupabaseWrite(input.tenantId);
  if (!input.planId) {
    throw new Error("Selecciona un plan parenteral.");
  }

  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase
    .from("parenteral_plans")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("parenteral_plans")
    .update({
      status: "closed",
      monitoring_notes: input.notes ?? rowNullableString(beforeData ?? {}, "monitoring_notes"),
      updated_by: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo cerrar el plan parenteral.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "parenteral_plan.closed",
    entityType: "parenteral_plans",
    entityId: rowString(data, "id"),
    beforeData: beforeData ?? null,
    afterData: { status: "closed", notes: input.notes ?? null },
  });

  return mapParenteralPlan(data, []);
}

export async function createSportsProfile(input: CreateSportsProfileInput) {
  requireSupabaseWrite(input.tenantId);
  assertPatient(input.patientId);
  if (!input.discipline.trim()) {
    throw new Error("Indica la disciplina deportiva.");
  }
  if (!input.category.trim()) {
    throw new Error("Indica la categoria deportiva.");
  }

  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("sports_profiles")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      discipline: input.discipline.trim(),
      category: input.category.trim(),
      position: input.position.trim() || null,
      objective: input.objective.trim() || null,
      staff_owner_user_id: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo guardar el perfil deportivo.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "sports_profile.create",
    entityType: "sports_profiles",
    entityId: rowString(data, "id"),
    afterData: {
      patient_id: input.patientId,
      discipline: input.discipline,
      category: input.category,
    },
  });

  return mapSportsProfile(data);
}

export async function createSportsBodycompSnapshot(input: CreateSportsBodycompSnapshotInput) {
  requireSupabaseWrite(input.tenantId);
  assertPatient(input.patientId);

  if (input.profile) {
    await createSportsProfile(input.profile);
  }

  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("sports_bodycomp_snapshots")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      endomorphy: input.endomorphy ?? null,
      mesomorphy: input.mesomorphy ?? null,
      ectomorphy: input.ectomorphy ?? null,
      fat_pct: input.fatPct ?? null,
      lean_mass_kg: input.leanMassKg ?? null,
      skeletal_muscle_kg: input.skeletalMuscleKg ?? null,
      notes: input.notes.trim() || null,
      measured_at: input.measuredAt ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo guardar el snapshot deportivo.");
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "sports_bodycomp_snapshot.create",
    entityType: "sports_bodycomp_snapshots",
    entityId: rowString(data, "id"),
    afterData: {
      patient_id: input.patientId,
      fat_pct: input.fatPct ?? null,
      skeletal_muscle_kg: input.skeletalMuscleKg ?? null,
    },
  });

  return mapSportsSnapshot(data);
}
