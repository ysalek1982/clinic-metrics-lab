import { calculateSomatotype, type SomatotypeResult } from "@/domain/sports/somatotypeEngine";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/services/clinicalService";

export interface SportsSourceResult<T> {
  source: "supabase" | "demo";
  data: T;
}

export interface SportsProfile {
  id: string;
  tenantId: string;
  patientId: string;
  discipline: string;
  category: string;
  position: string | null;
  objective: string | null;
  createdAt: string;
}

export interface SportsAssessment {
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
  somatotype: SomatotypeResult;
}

export interface SportsCcorpSource {
  id: string;
  patientId: string;
  measuredAt: string;
  endomorphy: number | null;
  mesomorphy: number | null;
  ectomorphy: number | null;
  fatPct: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null;
  formulaVersion: string;
}

export interface SportsPerformanceBundle {
  profiles: SportsProfile[];
  assessments: SportsAssessment[];
  ccorpSources: SportsCcorpSource[];
}

export interface SaveSportsProfileInput {
  tenantId: string;
  patientId: string;
  discipline: string;
  category: string;
  position: string | null;
  objective: string | null;
}

export interface UpdateSportsProfileInput extends SaveSportsProfileInput {
  profileId: string;
}

export interface CreateSportsAssessmentInput {
  tenantId: string;
  patientId: string;
  ccorpAssessmentId: string | null;
  fatPct: number | null;
  leanMassKg: number | null;
  skeletalMuscleKg: number | null;
  notes: string | null;
  measuredAt: string;
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

function requireSupabaseWrite(tenantId: string) {
  if (!supabase || !tenantId) {
    throw new Error("Supabase no está disponible para guardar datos deportivos.");
  }
}

function rowString(row: Record<string, unknown>, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function rowNullableString(row: Record<string, unknown>, key: string) {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function rowNumber(row: Record<string, unknown> | null | undefined, key: string) {
  if (!row) return null;
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapProfile(row: Record<string, unknown>): SportsProfile {
  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    patientId: rowString(row, "patient_id"),
    discipline: rowString(row, "discipline"),
    category: rowString(row, "category"),
    position: rowNullableString(row, "position"),
    objective: rowNullableString(row, "objective"),
    createdAt: rowString(row, "created_at"),
  };
}

function mapAssessment(row: Record<string, unknown>): SportsAssessment {
  const endomorphy = rowNumber(row, "endomorphy");
  const mesomorphy = rowNumber(row, "mesomorphy");
  const ectomorphy = rowNumber(row, "ectomorphy");

  return {
    id: rowString(row, "id"),
    tenantId: rowString(row, "tenant_id"),
    patientId: rowString(row, "patient_id"),
    endomorphy,
    mesomorphy,
    ectomorphy,
    fatPct: rowNumber(row, "fat_pct"),
    leanMassKg: rowNumber(row, "lean_mass_kg"),
    skeletalMuscleKg: rowNumber(row, "skeletal_muscle_kg"),
    notes: rowNullableString(row, "notes"),
    measuredAt: rowString(row, "measured_at"),
    somatotype: calculateSomatotype({ endomorphy, mesomorphy, ectomorphy }),
  };
}

function mapCcorpSource(assessment: Record<string, unknown>, result: Record<string, unknown> | null): SportsCcorpSource {
  return {
    id: rowString(assessment, "id"),
    patientId: rowString(assessment, "patient_id"),
    measuredAt: rowString(assessment, "measured_at"),
    endomorphy: rowNumber(result, "endomorphy"),
    mesomorphy: rowNumber(result, "mesomorphy"),
    ectomorphy: rowNumber(result, "ectomorphy"),
    fatPct: rowNumber(result, "durnin_body_fat_percent") ?? rowNumber(result, "withers_body_fat_percent"),
    fatMassKg: rowNumber(result, "durnin_fat_mass_kg") ?? rowNumber(result, "withers_fat_mass_kg"),
    leanMassKg: rowNumber(result, "durnin_fat_free_mass_kg") ?? rowNumber(result, "withers_fat_free_mass_kg"),
    formulaVersion: rowString(assessment, "formula_version"),
  };
}

async function readCcorpSources(tenantId: string) {
  const [assessments, results] = await Promise.all([
    supabase!
      .from("ccorp_level1_assessments")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("measured_at", { ascending: false }),
    supabase!.from("ccorp_level1_results").select("*").eq("tenant_id", tenantId),
  ]);

  if (assessments.error || results.error) {
    throw assessments.error ?? results.error ?? new Error("No se pudo cargar CCORP para deportivo.");
  }

  const resultByAssessment = new Map((results.data ?? []).map((row) => [rowString(row, "assessment_id"), row as Record<string, unknown>]));
  return (assessments.data ?? []).map((assessment) => mapCcorpSource(assessment, resultByAssessment.get(rowString(assessment, "id")) ?? null));
}

export async function getSportsPerformanceForTenant(tenantId: string | null): Promise<SportsSourceResult<SportsPerformanceBundle>> {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return { source: "demo", data: { profiles: [], assessments: [], ccorpSources: [] } };
  }

  const [profiles, assessments, ccorpSources] = await Promise.all([
    supabase.from("sports_profiles").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
    supabase
      .from("sports_bodycomp_snapshots")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("measured_at", { ascending: false })
      .order("created_at", { ascending: false }),
    readCcorpSources(tenantId),
  ]);

  if (profiles.error || assessments.error) {
    throw profiles.error ?? assessments.error ?? new Error("No se pudo cargar rendimiento deportivo.");
  }

  return {
    source: "supabase",
    data: {
      profiles: (profiles.data ?? []).map((row) => mapProfile(row)),
      assessments: (assessments.data ?? []).map((row) => mapAssessment(row)),
      ccorpSources,
    },
  };
}

export async function createSportsProfile(input: SaveSportsProfileInput) {
  requireSupabaseWrite(input.tenantId);
  if (!input.patientId) throw new Error("Selecciona un paciente real.");
  if (!input.discipline.trim()) throw new Error("Indica la disciplina deportiva.");
  if (!input.category.trim()) throw new Error("Indica el nivel o categoría deportiva.");

  const actorUserId = await currentUserId();
  const { data, error } = await supabase!
    .from("sports_profiles")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      discipline: input.discipline.trim(),
      category: input.category.trim(),
      position: input.position?.trim() || null,
      objective: input.objective?.trim() || null,
      staff_owner_user_id: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo crear el perfil deportivo.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "sports_profile.create",
    entityType: "sports_profiles",
    entityId: rowString(data, "id"),
    afterData: { patient_id: input.patientId, discipline: input.discipline, category: input.category },
  });

  return mapProfile(data);
}

export async function updateSportsProfile(input: UpdateSportsProfileInput) {
  requireSupabaseWrite(input.tenantId);
  if (!input.profileId) throw new Error("Selecciona un perfil deportivo.");
  if (!input.discipline.trim()) throw new Error("Indica la disciplina deportiva.");
  if (!input.category.trim()) throw new Error("Indica el nivel o categoría deportiva.");

  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase!
    .from("sports_profiles")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.profileId)
    .maybeSingle();

  const { data, error } = await supabase!
    .from("sports_profiles")
    .update({
      discipline: input.discipline.trim(),
      category: input.category.trim(),
      position: input.position?.trim() || null,
      objective: input.objective?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.profileId)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo actualizar el perfil deportivo.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "sports_profile.update",
    entityType: "sports_profiles",
    entityId: input.profileId,
    beforeData: beforeData ?? null,
    afterData: { discipline: input.discipline, category: input.category, position: input.position, objective: input.objective },
  });

  return mapProfile(data);
}

export async function createSportsAssessment(input: CreateSportsAssessmentInput) {
  requireSupabaseWrite(input.tenantId);
  if (!input.patientId) throw new Error("Selecciona un paciente real.");

  const ccorpSources = input.ccorpAssessmentId ? await readCcorpSources(input.tenantId) : [];
  const ccorpSource = input.ccorpAssessmentId ? ccorpSources.find((source) => source.id === input.ccorpAssessmentId) ?? null : null;
  if (input.ccorpAssessmentId && (!ccorpSource || ccorpSource.patientId !== input.patientId)) {
    throw new Error("La fuente CCORP seleccionada no pertenece al paciente.");
  }

  const actorUserId = await currentUserId();
  const sourceNote = ccorpSource ? `Fuente CCORP Nivel 1 ${ccorpSource.id}.` : "Sin fuente CCORP: no se calcula somatotipo.";
  const notes = [input.notes?.trim(), sourceNote].filter(Boolean).join(" ");
  const { data, error } = await supabase!
    .from("sports_bodycomp_snapshots")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      endomorphy: ccorpSource?.endomorphy ?? null,
      mesomorphy: ccorpSource?.mesomorphy ?? null,
      ectomorphy: ccorpSource?.ectomorphy ?? null,
      fat_pct: ccorpSource?.fatPct ?? input.fatPct ?? null,
      lean_mass_kg: ccorpSource?.leanMassKg ?? input.leanMassKg ?? null,
      skeletal_muscle_kg: input.skeletalMuscleKg ?? null,
      notes: notes || null,
      measured_at: input.measuredAt || new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo crear la evaluación deportiva.");

  const assessment = mapAssessment(data);
  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "sports_assessment.create",
    entityType: "sports_bodycomp_snapshots",
    entityId: assessment.id,
    afterData: {
      patient_id: input.patientId,
      ccorp_assessment_id: ccorpSource?.id ?? null,
      somatotype_status: assessment.somatotype.status,
      fat_pct: assessment.fatPct,
    },
  });

  return assessment;
}
