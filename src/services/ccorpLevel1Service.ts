import { CCORP_LEVEL1_FORMULA_VERSION, CCORP_LEVEL1_VARIABLES, getCcorpVariable } from "@/domain/ccorpLevel1/ccorpLevel1Formulas";
import { calculateCcorpLevel1 } from "@/domain/ccorpLevel1/ccorpLevel1Engine";
import type { CcorpLevel1Input, CcorpLevel1Results, CcorpMeasurementInput, CcorpSex } from "@/domain/ccorpLevel1/ccorpLevel1Types";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { writeAuditLog } from "@/services/clinicalService";

export interface CcorpLevel1Summary {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  encounterId: string | null;
  encounterTitle: string | null;
  measuredAt: string;
  ageDecimal: number | null;
  sex: CcorpSex;
  status: string;
  durninBodyFatPercent: number | null;
  durninFatMassKg: number | null;
  durninFatFreeMassKg: number | null;
  withersBodyFatPercent: number | null;
  endomorphy: number | null;
  mesomorphy: number | null;
  ectomorphy: number | null;
  createdAt: string;
}

export interface CcorpLevel1Detail extends CcorpLevel1Summary {
  birthDateSnapshot: string | null;
  organizationId: string | null;
  clinicalAssessmentId: string | null;
  notes: string | null;
  formulaVersion: string;
  measurements: Array<{
    id: string;
    variableCode: string;
    variableLabel: string;
    category: string;
    unit: string;
    series: Array<number | null>;
    medianValue: number | null;
  }>;
  results: CcorpLevel1Results | null;
  reportSnapshots: Array<{
    id: string;
    generatedAt: string;
    generatedBy: string | null;
    reportPayload: Json;
  }>;
}

export interface CcorpQueryOptions {
  allowDemo: boolean;
}

type AssessmentRow = {
  id: string;
  tenant_id: string;
  organization_id: string | null;
  patient_id: string;
  encounter_id: string | null;
  clinical_assessment_id: string | null;
  measured_at: string;
  birth_date_snapshot: string | null;
  age_decimal: number | string | null;
  sex: CcorpSex;
  formula_version: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type ResultRow = Record<string, number | string | string[] | null>;
type MeasurementRow = Record<string, number | string | null>;

async function hasRemoteSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session.user);
}

async function currentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user.id ?? null;
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function mapResultRow(row: ResultRow | null | undefined, targets: Array<Record<string, unknown>> = []): CcorpLevel1Results | null {
  if (!row) return null;
  return {
    ageDecimal: null,
    medians: Object.fromEntries(CCORP_LEVEL1_VARIABLES.map((variable) => [variable.code, null])) as CcorpLevel1Results["medians"],
    bmi: numberOrNull(row.bmi),
    waistHipRatio: numberOrNull(row.waist_hip_ratio),
    sum6Skinfolds: numberOrNull(row.sum_6_skinfolds),
    durninBodyDensityMale: numberOrNull(row.durnin_body_density_male),
    durninBodyDensityFemale: numberOrNull(row.durnin_body_density_female),
    durninBodyFatPercent: numberOrNull(row.durnin_body_fat_percent),
    durninFatMassKg: numberOrNull(row.durnin_fat_mass_kg),
    durninFatFreeMassKg: numberOrNull(row.durnin_fat_free_mass_kg),
    durninFmi: numberOrNull(row.durnin_fmi),
    durninFfmi: numberOrNull(row.durnin_ffmi),
    withersBodyFatPercent: numberOrNull(row.withers_body_fat_percent),
    withersFatMassKg: numberOrNull(row.withers_fat_mass_kg),
    withersFatFreeMassKg: numberOrNull(row.withers_fat_free_mass_kg),
    withersFmi: numberOrNull(row.withers_fmi),
    withersFfmi: numberOrNull(row.withers_ffmi),
    armMuscleAreaMm2: numberOrNull(row.arm_muscle_area_mm2),
    endomorphy: numberOrNull(row.endomorphy),
    mesomorphy: numberOrNull(row.mesomorphy),
    ectomorphy: numberOrNull(row.ectomorphy),
    hwr: numberOrNull(row.hwr),
    somatoX: numberOrNull(row.somato_x),
    somatoY: numberOrNull(row.somato_y),
    idealTargets: targets.map((target) => ({
      method: target.method === "withers" ? "withers" : "durnin",
      targetBodyFatPercent: numberOrNull(target.target_body_fat_percent),
      targetFfmi: numberOrNull(target.target_ffmi),
      idealWeightKg: numberOrNull(target.ideal_weight_kg),
      targetFatMassKg: numberOrNull(target.target_fat_mass_kg),
      fatToLoseKg: numberOrNull(target.fat_to_lose_kg),
      targetFatFreeMassKg: numberOrNull(target.target_fat_free_mass_kg),
      leanMassToGainKg: numberOrNull(target.lean_mass_to_gain_kg),
    })),
    warnings: Array.isArray(row.warnings) ? row.warnings.filter((item): item is string => typeof item === "string") : [],
  };
}

function mapSummary(row: AssessmentRow, patientName: string, encounterTitle: string | null, result: ResultRow | null): CcorpLevel1Summary {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    patientName,
    encounterId: row.encounter_id,
    encounterTitle,
    measuredAt: row.measured_at,
    ageDecimal: numberOrNull(row.age_decimal),
    sex: row.sex,
    status: row.status,
    durninBodyFatPercent: numberOrNull(result.durnin_body_fat_percent),
    durninFatMassKg: numberOrNull(result.durnin_fat_mass_kg),
    durninFatFreeMassKg: numberOrNull(result.durnin_fat_free_mass_kg),
    withersBodyFatPercent: numberOrNull(result.withers_body_fat_percent),
    endomorphy: numberOrNull(result.endomorphy),
    mesomorphy: numberOrNull(result.mesomorphy),
    ectomorphy: numberOrNull(result.ectomorphy),
    createdAt: row.created_at,
  };
}

async function resolveNames(tenantId: string, rows: AssessmentRow[]) {
  const patientIds = [...new Set(rows.map((row) => row.patient_id))];
  const encounterIds = [...new Set(rows.map((row) => row.encounter_id).filter((id): id is string => Boolean(id)))];
  const [patients, encounters] = await Promise.all([
    patientIds.length
      ? supabase!.from("patients").select("id,first_name,last_name,mrn").eq("tenant_id", tenantId).in("id", patientIds)
      : Promise.resolve({ data: [], error: null }),
    encounterIds.length
      ? supabase!.from("encounters").select("id,title").eq("tenant_id", tenantId).in("id", encounterIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (patients.error || encounters.error) throw patients.error ?? encounters.error;

  const patientMap = new Map(
    ((patients.data ?? []) as Array<Record<string, unknown>>).map((patient) => [
      String(patient.id),
      `${textOrNull(patient.first_name) ?? ""} ${textOrNull(patient.last_name) ?? ""}`.trim() || textOrNull(patient.mrn) || "Paciente",
    ]),
  );
  const encounterMap = new Map(
    ((encounters.data ?? []) as Array<Record<string, unknown>>).map((encounter) => [String(encounter.id), textOrNull(encounter.title) ?? "Episodio"]),
  );

  return { patientMap, encounterMap };
}

export async function listCcorpAssessments(tenantId: string | null, options: CcorpQueryOptions = {}) {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    if (options.allowDemo) {
      return { source: "demo" as const, data: [] as CcorpLevel1Summary[] };
    }

    throw new Error("No hay sesión clínica válida para consultar CCORP Nivel 1.");
  }

  const [assessments, results] = await Promise.all([
    supabase
      .from("ccorp_level1_assessments")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("measured_at", { ascending: false }),
    supabase.from("ccorp_level1_results").select("*").eq("tenant_id", tenantId),
  ]);

  if (assessments.error || results.error) throw assessments.error ?? results.error;

  const rows = (assessments.data ?? []) as AssessmentRow[];
  const resultMap = new Map(((results.data ?? []) as Array<ResultRow & { assessment_id: string }>).map((row) => [row.assessment_id, row]));
  const { patientMap, encounterMap } = await resolveNames(tenantId, rows);

  return {
    source: "supabase" as const,
    data: rows.map((row) =>
      mapSummary(row, patientMap.get(row.patient_id) ?? "Paciente", row.encounter_id ? encounterMap.get(row.encounter_id) ?? null : null, resultMap.get(row.id)),
    ),
  };
}

export async function getCcorpAssessment(tenantId: string | null, assessmentId: string | null, options: CcorpQueryOptions = {}) {
  if (!supabase || !tenantId || !assessmentId || !(await hasRemoteSession())) {
    if (options.allowDemo) {
      return { source: "demo" as const, data: null as CcorpLevel1Detail | null };
    }

    throw new Error("No hay sesión clínica válida para consultar el informe CCORP Nivel 1.");
  }

  const [assessment, measurements, results, targets, snapshots] = await Promise.all([
    supabase.from("ccorp_level1_assessments").select("*").eq("tenant_id", tenantId).eq("id", assessmentId).maybeSingle(),
    supabase.from("ccorp_level1_measurements").select("*").eq("tenant_id", tenantId).eq("assessment_id", assessmentId).order("category"),
    supabase.from("ccorp_level1_results").select("*").eq("tenant_id", tenantId).eq("assessment_id", assessmentId).maybeSingle(),
    supabase.from("ccorp_level1_ideal_weight_targets").select("*").eq("tenant_id", tenantId).eq("assessment_id", assessmentId).order("method"),
    supabase.from("ccorp_level1_report_snapshots").select("*").eq("tenant_id", tenantId).eq("assessment_id", assessmentId).order("generated_at", { ascending: false }),
  ]);

  if (assessment.error || measurements.error || results.error || targets.error || snapshots.error) {
    throw assessment.error ?? measurements.error ?? results.error ?? targets.error ?? snapshots.error;
  }

  const row = assessment.data as AssessmentRow | null;
  if (!row) return { source: "supabase" as const, data: null };

  const { patientMap, encounterMap } = await resolveNames(tenantId, [row]);
  const mappedResults = mapResultRow(results.data as ResultRow | null, (targets.data ?? []) as Array<Record<string, unknown>>);
  const mappedMeasurements = ((measurements.data ?? []) as MeasurementRow[]).map((measurement) => ({
    id: String(measurement.id),
    variableCode: String(measurement.variable_code),
    variableLabel: String(measurement.variable_label),
    category: String(measurement.category),
    unit: String(measurement.unit),
    series: [
      numberOrNull(measurement.series_1),
      numberOrNull(measurement.series_2),
      numberOrNull(measurement.series_3),
      numberOrNull(measurement.series_4),
      numberOrNull(measurement.series_5),
    ],
    medianValue: numberOrNull(measurement.median_value),
  }));

  if (mappedResults) {
    mappedResults.ageDecimal = numberOrNull(row.age_decimal);
    mappedResults.medians = Object.fromEntries(
      CCORP_LEVEL1_VARIABLES.map((variable) => [
        variable.code,
        mappedMeasurements.find((measurement) => measurement.variableCode === variable.code)?.medianValue ?? null,
      ]),
    ) as CcorpLevel1Results["medians"];
  }

  return {
    source: "supabase" as const,
    data: {
      ...mapSummary(row, patientMap.get(row.patient_id) ?? "Paciente", row.encounter_id ? encounterMap.get(row.encounter_id) ?? null : null, results.data as ResultRow | null),
      birthDateSnapshot: row.birth_date_snapshot,
      organizationId: row.organization_id,
      clinicalAssessmentId: row.clinical_assessment_id,
      notes: row.notes,
      formulaVersion: row.formula_version,
      measurements: mappedMeasurements,
      results: mappedResults,
      reportSnapshots: ((snapshots.data ?? []) as Array<Record<string, unknown>>).map((snapshot) => ({
        id: String(snapshot.id),
        generatedAt: String(snapshot.generated_at),
        generatedBy: textOrNull(snapshot.generated_by),
        reportPayload: (snapshot.report_payload ?? {}) as Json,
      })),
    },
  };
}

export async function createCcorpAssessment(input: {
  tenantId: string;
  organizationId: string | null;
  patientId: string;
  encounterId: string | null;
  clinicalAssessmentId: string | null;
  measuredAt: string;
  birthDateSnapshot: string | null;
  sex: CcorpSex;
  notes: string | null;
  measurements: CcorpMeasurementInput[];
  durninTargetBodyFatPercent: number | null;
  durninTargetFfmi: number | null;
  withersTargetBodyFatPercent: number | null;
  withersTargetFfmi: number | null;
}) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const actorUserId = await currentUserId();
  const results = calculateCcorpLevel1({
    measuredAt: input.measuredAt,
    birthDate: input.birthDateSnapshot ?? null,
    sex: input.sex,
    measurements: input.measurements,
    durninTargetBodyFatPercent: input.durninTargetBodyFatPercent,
    durninTargetFfmi: input.durninTargetFfmi,
    withersTargetBodyFatPercent: input.withersTargetBodyFatPercent,
    withersTargetFfmi: input.withersTargetFfmi,
  });

  const { data, error } = await supabase
    .from("ccorp_level1_assessments")
    .insert({
      tenant_id: input.tenantId,
      organization_id: input.organizationId ?? null,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      clinical_assessment_id: input.clinicalAssessmentId ?? null,
      measured_at: input.measuredAt,
      birth_date_snapshot: input.birthDateSnapshot ?? null,
      age_decimal: results.ageDecimal,
      sex: input.sex,
      formula_version: CCORP_LEVEL1_FORMULA_VERSION,
      status: "completed",
      notes: input.notes ?? null,
      created_by: actorUserId,
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo crear la evaluación CCORP Nivel 1.");

  const assessmentId = String((data as Record<string, unknown>).id);
  const measurementRows = input.measurements.map((measurement) => {
    const definition = getCcorpVariable(measurement.variableCode);
    return {
      tenant_id: input.tenantId,
      assessment_id: assessmentId,
      variable_code: measurement.variableCode,
      variable_label: definition.label ?? measurement.variableCode,
      category: definition.category ?? "basic",
      unit: definition.unit ?? "",
      series_1: measurement.series[0] ?? null,
      series_2: measurement.series[1] ?? null,
      series_3: measurement.series[2] ?? null,
      series_4: measurement.series[3] ?? null,
      series_5: measurement.series[4] ?? null,
      median_value: results.medians[measurement.variableCode],
    };
  });

  const { error: measurementsError } = await supabase.from("ccorp_level1_measurements").insert(measurementRows);
  if (measurementsError) throw measurementsError;

  const { error: resultsError } = await supabase.from("ccorp_level1_results").insert({
    tenant_id: input.tenantId,
    assessment_id: assessmentId,
    bmi: results.bmi,
    waist_hip_ratio: results.waistHipRatio,
    sum_6_skinfolds: results.sum6Skinfolds,
    durnin_body_density_male: results.durninBodyDensityMale,
    durnin_body_density_female: results.durninBodyDensityFemale,
    durnin_body_fat_percent: results.durninBodyFatPercent,
    durnin_fat_mass_kg: results.durninFatMassKg,
    durnin_fat_free_mass_kg: results.durninFatFreeMassKg,
    durnin_fmi: results.durninFmi,
    durnin_ffmi: results.durninFfmi,
    withers_body_fat_percent: results.withersBodyFatPercent,
    withers_fat_mass_kg: results.withersFatMassKg,
    withers_fat_free_mass_kg: results.withersFatFreeMassKg,
    withers_fmi: results.withersFmi,
    withers_ffmi: results.withersFfmi,
    arm_muscle_area_mm2: results.armMuscleAreaMm2,
    endomorphy: results.endomorphy,
    mesomorphy: results.mesomorphy,
    ectomorphy: results.ectomorphy,
    hwr: results.hwr,
    somato_x: results.somatoX,
    somato_y: results.somatoY,
    warnings: results.warnings,
  });
  if (resultsError) throw resultsError;

  const { error: targetsError } = await supabase.from("ccorp_level1_ideal_weight_targets").insert(
    results.idealTargets.map((target) => ({
      tenant_id: input.tenantId,
      assessment_id: assessmentId,
      method: target.method,
      target_body_fat_percent: target.targetBodyFatPercent,
      target_ffmi: target.targetFfmi,
      ideal_weight_kg: target.idealWeightKg,
      target_fat_mass_kg: target.targetFatMassKg,
      fat_to_lose_kg: target.fatToLoseKg,
      target_fat_free_mass_kg: target.targetFatFreeMassKg,
      lean_mass_to_gain_kg: target.leanMassToGainKg,
    })),
  );
  if (targetsError) throw targetsError;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "ccorp_level1.create",
    entityType: "ccorp_level1_assessments",
    entityId: assessmentId,
    afterData: {
      patient_id: input.patientId,
      measured_at: input.measuredAt,
      durnin_body_fat_percent: results.durninBodyFatPercent,
      endomorphy: results.endomorphy,
      mesomorphy: results.mesomorphy,
      ectomorphy: results.ectomorphy,
    },
  });

  return { assessmentId, results };
}

export async function createCcorpReportSnapshot(input: {
  tenantId: string;
  assessmentId: string;
  reportPayload: Json;
}) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("ccorp_level1_report_snapshots")
    .insert({
      tenant_id: input.tenantId,
      assessment_id: input.assessmentId,
      report_payload: input.reportPayload,
      generated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo generar el snapshot del informe CCORP.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "ccorp_level1.report_snapshot",
    entityType: "ccorp_level1_report_snapshots",
    entityId: String((data as Record<string, unknown>).id),
    afterData: { assessment_id: input.assessmentId },
  });

  return data;
}
