import { supabase } from "@/integrations/supabase/client";
import {
  calculateAgeAtDate,
  calculatePediatricBmi,
  evaluatePediatricGrowth,
  type GrowthIndicatorCode,
  type GrowthReferencePoint,
  type GrowthReferencePolicy,
  type GrowthReferenceSet,
  type PediatricMeasurementInput,
  type PediatricSex,
} from "@/domain/clinical/pediatricGrowthEngine";
import { writeAuditLog } from "@/services/clinicalService";
import type { RiskLevel } from "@/types/domain";

export interface PediatricGrowthPatient {
  id: string;
  tenantId: string;
  organizationId: string | null;
  mrn: string;
  fullName: string;
  birthDate: string | null;
  sex: PediatricSex | "other";
  risk: RiskLevel;
  diagnosisSummary: string;
  location: string;
}

export interface PediatricGrowthStoredResult {
  id: string;
  recordId: string;
  patientId: string;
  indicatorCode: GrowthIndicatorCode;
  measurementValue: number | null;
  zScore: number | null;
  percentile: number | null;
  classification: string | null;
  interpretation: string | null;
  referenceId: string | null;
  referenceVersion: string | null;
  flags: string[];
}

export interface PediatricGrowthRecord {
  id: string;
  tenantId: string;
  organizationId: string | null;
  patientId: string;
  encounterId: string | null;
  measuredAt: string;
  ageMonths: number;
  ageDaysTotal: number | null;
  sexReference: PediatricSex | "other";
  measurement: PediatricMeasurementInput;
  standardRef: string;
  notes: string | null;
  results: PediatricGrowthStoredResult[];
}

export interface PediatricGrowthRecordsResult {
  source: "supabase" | "demo";
  records: PediatricGrowthRecord[];
}

export interface PediatricGrowthPatientsResult {
  source: "supabase" | "demo";
  patients: PediatricGrowthPatient[];
}

export interface SavePediatricGrowthInput {
  tenantId: string;
  patient: PediatricGrowthPatient;
  encounterId: string | null;
  measuredAt: string;
  measurement: Omit<PediatricMeasurementInput, "measuredAt">;
  notes: string | null;
  referenceSets: GrowthReferenceSet[];
  referencePoints: GrowthReferencePoint[];
  policies: GrowthReferencePolicy[];
}

type UnknownRow = Record<string, unknown>;

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

function stringValue(row: UnknownRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function nullableString(row: UnknownRow, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

function numberValue(row: UnknownRow, key: string) {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArrayValue(row: UnknownRow, key: string) {
  const value = row[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeSex(value: string): PediatricSex | "other" {
  return value === "female" || value === "male" ? value : "other";
}

function normalizeRisk(value: string): RiskLevel {
  return value === "critical" || value === "high" || value === "moderate" || value === "low" ? value : "low";
}

function mapPatient(row: UnknownRow): PediatricGrowthPatient {
  return {
    id: stringValue(row, "id"),
    tenantId: stringValue(row, "tenant_id"),
    organizationId: nullableString(row, "organization_id"),
    mrn: stringValue(row, "mrn"),
    fullName: `${stringValue(row, "first_name")} ${stringValue(row, "last_name")}`.trim(),
    birthDate: nullableString(row, "birth_date"),
    sex: normalizeSex(stringValue(row, "sex", "other")),
    risk: normalizeRisk(stringValue(row, "risk_level", "low")),
    diagnosisSummary: nullableString(row, "diagnosis_summary") ?? "Sin diagnóstico resumido",
    location: nullableString(row, "location_label") ?? "Sin ubicacion",
  };
}

function mapStoredResult(row: UnknownRow): PediatricGrowthStoredResult {
  return {
    id: stringValue(row, "id"),
    recordId: stringValue(row, "growth_record_id"),
    patientId: stringValue(row, "patient_id"),
    indicatorCode: stringValue(row, "indicator_code") as GrowthIndicatorCode,
    referenceId: nullableString(row, "reference_id"),
    referenceVersion: nullableString(row, "reference_version"),
    measurementValue: numberValue(row, "measurement_value"),
    zScore: numberValue(row, "z_score"),
    percentile: numberValue(row, "percentile"),
    classification: nullableString(row, "classification"),
    interpretation: nullableString(row, "interpretation"),
    flags: stringArrayValue(row, "flags"),
  };
}

function metricFallback(row: UnknownRow, metric: string) {
  return stringValue(row, "metric") === metric ? numberValue(row, "value") : null;
}

function mapRecord(row: UnknownRow, results: PediatricGrowthStoredResult[]): PediatricGrowthRecord {
  const measuredAt = stringValue(row, "measured_at");
  const ageMonths = numberValue(row, "age_months") ?? 0;

  return {
    id: stringValue(row, "id"),
    tenantId: stringValue(row, "tenant_id"),
    organizationId: nullableString(row, "organization_id"),
    patientId: stringValue(row, "patient_id"),
    encounterId: nullableString(row, "encounter_id"),
    measuredAt,
    ageMonths,
    ageDaysTotal: numberValue(row, "age_days_total"),
    sexReference: normalizeSex(stringValue(row, "sex_reference") || stringValue(row, "sex", "other")),
    measurement: {
      measuredAt,
      weightKg: numberValue(row, "weight_kg") ?? metricFallback(row, "weight_for_age"),
      lengthCm: numberValue(row, "length_cm") ?? metricFallback(row, "length_for_age"),
      heightCm: numberValue(row, "height_cm") ?? metricFallback(row, "height_for_age"),
      headCircumferenceCm: numberValue(row, "head_circumference_cm") ?? metricFallback(row, "head_circumference_for_age"),
      armCircumferenceCm: numberValue(row, "arm_circumference_cm") ?? metricFallback(row, "arm_circumference_for_age"),
      tricepsSkinfoldMm: numberValue(row, "triceps_skinfold_mm") ?? metricFallback(row, "triceps_skinfold_for_age"),
      subscapularSkinfoldMm: numberValue(row, "subscapular_skinfold_mm") ?? metricFallback(row, "subscapular_skinfold_for_age"),
      notes: nullableString(row, "notes"),
    },
    standardRef: stringValue(row, "standard_ref", "Sin referencia"),
    notes: nullableString(row, "notes"),
    results: results.filter((result) => result.recordId === stringValue(row, "id")),
  };
}

export async function getPediatricGrowthPatients(tenantId: string | null): Promise<PediatricGrowthPatientsResult> {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return { source: "demo", patients: [] };
  }

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  if (error || !data) {
    throw error ?? new Error("No se pudieron cargar pacientes pediátricos.");
  }

  return {
    source: "supabase",
    patients: (data as UnknownRow[])
      .filter((row) => {
        const packs = stringArrayValue(row, "active_pack_ids");
        return stringValue(row, "primary_pack_id") === "pediatric" || packs.includes("pediatric");
      })
      .map(mapPatient),
  };
}

export async function getPediatricGrowthRecords(
  tenantId: string | null,
  patientId: string | null,
): Promise<PediatricGrowthRecordsResult> {
  if (!supabase || !tenantId || !patientId || !(await hasRemoteSession())) {
    return { source: "demo", records: [] };
  }

  const [recordsResult, resultsResult] = await Promise.all([
    supabase
      .from("pediatric_growth_records")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .order("measured_at", { ascending: true }),
    supabase
      .from("pediatric_growth_results")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("patient_id", patientId),
  ]);

  if (recordsResult.error || resultsResult.error) {
    throw recordsResult.error ?? resultsResult.error ?? new Error("No se pudo cargar crecimiento pediátrico.");
  }

  const results = ((resultsResult.data ?? []) as UnknownRow[]).map(mapStoredResult);

  return {
    source: "supabase",
    records: ((recordsResult.data ?? []) as UnknownRow[]).map((row) => mapRecord(row, results)),
  };
}

export async function savePediatricGrowthRecord(input: SavePediatricGrowthInput) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  if (!input.patient.birthDate) throw new Error("El paciente no tiene fecha de nacimiento registrada.");
  if (input.patient.sex !== "female" && input.patient.sex !== "male") {
    throw new Error("El paciente no tiene sexo biológico compatible con referencias pediátricas.");
  }

  const measurement: PediatricMeasurementInput = {
    ...input.measurement,
    measuredAt: input.measuredAt,
  };
  const age = calculateAgeAtDate(input.patient.birthDate, input.measuredAt);
  const stature = measurement.heightCm ?? measurement.lengthCm ?? null;
  const bmi = calculatePediatricBmi(measurement.weightKg, stature) ?? null;
  const evaluation = evaluatePediatricGrowth({
    patient: {
      birthDate: input.patient.birthDate,
      sex: input.patient.sex,
    },
    measurement,
    referenceSets: input.referenceSets,
    referencePoints: input.referencePoints,
    policies: input.policies,
  });
  const actorUserId = await currentUserId();

  const { data: record, error: recordError } = await supabase
    .from("pediatric_growth_records")
    .insert({
      tenant_id: input.tenantId,
      organization_id: input.patient.organizationId,
      patient_id: input.patient.id,
      encounter_id: input.encounterId ?? null,
      measured_at: input.measuredAt,
      age_months: age.ageMonths,
      age_days_total: age.ageDaysTotal,
      sex: input.patient.sex,
      sex_reference: input.patient.sex,
      weight_kg: measurement.weightKg ?? null,
      length_cm: measurement.lengthCm ?? null,
      height_cm: measurement.heightCm ?? null,
      bmi,
      head_circumference_cm: measurement.headCircumferenceCm ?? null,
      arm_circumference_cm: measurement.armCircumferenceCm ?? null,
      triceps_skinfold_mm: measurement.tricepsSkinfoldMm ?? null,
      subscapular_skinfold_mm: measurement.subscapularSkinfoldMm ?? null,
      standard_ref: "tenant_policy",
      notes: input.notes ?? null,
      created_by: actorUserId,
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (recordError || !record) {
    throw recordError ?? new Error("No se pudo guardar la medición pediátrica.");
  }

  const resultRows = evaluation.indicators.map((result) => ({
    tenant_id: input.tenantId,
    growth_record_id: String((record as UnknownRow).id),
    patient_id: input.patient.id,
    indicator_code: result.indicatorCode,
    reference_id: result.referenceId ?? null,
    reference_version: result.referenceVersion ?? null,
    measurement_value: result.measurementValue,
    z_score: result.zScore ?? null,
    percentile: result.percentile ?? null,
    classification: result.classification,
    interpretation: result.interpretation,
    flags: result.flags,
  }));

  if (resultRows.length > 0) {
    const { error: resultsError } = await supabase.from("pediatric_growth_results").insert(resultRows);
    if (resultsError) throw resultsError;
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "pediatric_measurement.create",
    entityType: "pediatric_growth_record",
    entityId: String((record as UnknownRow).id),
    afterData: {
      patient_id: input.patient.id,
      measured_at: input.measuredAt,
      age_months: age.ageMonths,
      weight_kg: measurement.weightKg ?? null,
      height_cm: measurement.heightCm ?? null,
      length_cm: measurement.lengthCm ?? null,
      result_count: resultRows.length,
    },
  });

  const calculatedResults = evaluation.indicators.filter((result) => result.referenceStatus === "complete" && result.zScore !== null);
  if (calculatedResults.length > 0) {
    await writeAuditLog({
      tenantId: input.tenantId,
      actorUserId,
      eventType: "pediatric_result.calculated",
      entityType: "pediatric_growth_record",
      entityId: String((record as UnknownRow).id),
      afterData: {
        patient_id: input.patient.id,
        measured_at: input.measuredAt,
        calculated_indicators: calculatedResults.map((result) => ({
          indicator_code: result.indicatorCode,
          reference_id: result.referenceId,
          reference_version: result.referenceVersion,
          z_score: result.zScore,
          percentile: result.percentile,
          classification: result.classification,
        })),
      },
    });
  }

  return record;
}
