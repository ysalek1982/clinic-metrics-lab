import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { writeAuditLog } from "@/services/clinicalService";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type AppointmentType = "consulta" | "antropometria" | "educacion" | "telemedicina" | "seguimiento" | "control_labs" | "otro";

export type AppointmentSummary = {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  professionalUserId: string | null;
  professionalName: string | null;
  startsAt: string;
  endsAt: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  modality: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentPayload = {
  tenantId: string;
  patientId: string;
  professionalUserId?: string | null;
  startsAt: string;
  endsAt: string;
  appointmentType: AppointmentType;
  status?: AppointmentStatus;
  modality?: string | null;
  location?: string | null;
  notes?: string | null;
};

export type UpdateAppointmentPayload = Partial<Omit<AppointmentPayload, "tenantId">> & {
  tenantId: string;
  appointmentId: string;
};

type AppointmentRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  professional_user_id: string | null;
  starts_at: string;
  ends_at: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  modality: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PatientRow = {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type QueryResult = {
  data: unknown;
  error: unknown;
};

type SupabaseQueryBuilder = PromiseLike<QueryResult> & {
  select: (...args: unknown[]) => SupabaseQueryBuilder;
  insert: (...args: unknown[]) => SupabaseQueryBuilder;
  update: (...args: unknown[]) => SupabaseQueryBuilder;
  eq: (...args: unknown[]) => SupabaseQueryBuilder;
  is: (...args: unknown[]) => SupabaseQueryBuilder;
  in: (...args: unknown[]) => SupabaseQueryBuilder;
  gte: (...args: unknown[]) => SupabaseQueryBuilder;
  lt: (...args: unknown[]) => SupabaseQueryBuilder;
  order: (...args: unknown[]) => SupabaseQueryBuilder;
  limit: (...args: unknown[]) => SupabaseQueryBuilder;
  single: () => Promise<QueryResult>;
};

type SupabaseAnyClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from: (table: string) => SupabaseQueryBuilder;
};

const client = supabase as unknown as SupabaseAnyClient;

async function requireCurrentUserId() {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Sesión requerida para operar la agenda.");
  return data.user.id;
}

function validateAppointmentWindow(startsAt: string, endsAt: string) {
  if (!startsAt || !endsAt) throw new Error("Fecha y horario de la cita son obligatorios.");
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    throw new Error("La hora de fin debe ser posterior a la hora de inicio.");
  }
}

function mapAppointment(row: AppointmentRow, patientMap: Map<string, PatientRow>, professionalMap: Map<string, ProfileRow>): AppointmentSummary {
  const patient = patientMap.get(row.patient_id);
  const professional = row.professional_user_id ? professionalMap.get(row.professional_user_id) : null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Paciente no disponible",
    patientMrn: patient?.mrn ?? "--",
    professionalUserId: row.professional_user_id,
    professionalName: professional?.full_name ?? professional?.email ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    appointmentType: row.appointment_type,
    status: row.status,
    modality: row.modality,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function hydrateAppointments(rows: AppointmentRow[]) {
  const patientIds = [...new Set(rows.map((row) => row.patient_id))];
  const professionalIds = [...new Set(rows.map((row) => row.professional_user_id).filter((id): id is string => Boolean(id)))];

  const [patientsResult, profilesResult] = await Promise.all([
    patientIds.length > 0
      ? client.from("patients").select("id,mrn,first_name,last_name").in("id", patientIds)
      : Promise.resolve({ data: [] as PatientRow[], error: null }),
    professionalIds.length > 0
      ? client.from("user_profiles").select("id,full_name,email").in("id", professionalIds)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
  ]);

  if (patientsResult.error) throw patientsResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const patientMap = new Map<PatientRow>((patientsResult.data ?? []).map((patient: PatientRow) => [patient.id, patient]));
  const professionalMap = new Map<ProfileRow>((profilesResult.data ?? []).map((profile: ProfileRow) => [profile.id, profile]));

  return rows.map((row) => mapAppointment(row, patientMap, professionalMap));
}

export async function listAppointments(tenantId: string, weekStart: string, weekEnd: string) {
  const { data, error } = await client
    .from("appointments")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("starts_at", weekStart)
    .lt("starts_at", weekEnd)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return hydrateAppointments((data ?? []) as AppointmentRow[]);
}

export async function listUpcomingAppointments(tenantId: string, limit = 8) {
  const { data, error } = await client
    .from("appointments")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .in("status", ["scheduled"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return hydrateAppointments((data ?? []) as AppointmentRow[]);
}

export async function listPatientAppointments(tenantId: string, patientId: string, limit = 20) {
  const { data, error } = await client
    .from("appointments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return hydrateAppointments((data ?? []) as AppointmentRow[]);
}

export async function createAppointment(input: AppointmentPayload) {
  validateAppointmentWindow(input.startsAt, input.endsAt);
  const userId = await requireCurrentUserId();

  const { data, error } = await client
    .from("appointments")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      professional_user_id: input.professionalUserId ?? null,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      appointment_type: input.appointmentType,
      status: input.status ?? "scheduled",
      modality: input.modality ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "appointment.create",
    entityType: "appointment",
    entityId: data.id,
    afterData: data as Json,
  });

  return data as AppointmentRow;
}

export async function updateAppointment(input: UpdateAppointmentPayload) {
  const userId = await requireCurrentUserId();
  const { data: before, error: beforeError } = await client
    .from("appointments")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.appointmentId)
    .single();

  if (beforeError) throw beforeError;

  const nextStartsAt = input.startsAt ?? before.starts_at;
  const nextEndsAt = input.endsAt ?? before.ends_at;
  validateAppointmentWindow(nextStartsAt, nextEndsAt);

  const patch: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (input.patientId !== undefined) patch.patient_id = input.patientId;
  if (input.professionalUserId !== undefined) patch.professional_user_id = input.professionalUserId;
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (input.appointmentType !== undefined) patch.appointment_type = input.appointmentType;
  if (input.status !== undefined) patch.status = input.status;
  if (input.modality !== undefined) patch.modality = input.modality;
  if (input.location !== undefined) patch.location = input.location;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await client
    .from("appointments")
    .update(patch)
    .eq("tenant_id", input.tenantId)
    .eq("id", input.appointmentId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "appointment.update",
    entityType: "appointment",
    entityId: input.appointmentId,
    beforeData: before as Json,
    afterData: data as Json,
  });

  return data as AppointmentRow;
}

export async function completeAppointment(input: { tenantId: string; appointmentId: string }) {
  return setAppointmentStatus(input, "completed", "appointment.completed");
}

export async function cancelAppointment(input: { tenantId: string; appointmentId: string }) {
  return setAppointmentStatus(input, "cancelled", "appointment.cancelled");
}

async function setAppointmentStatus(
  input: { tenantId: string; appointmentId: string },
  status: AppointmentStatus,
  eventType: "appointment.completed" | "appointment.cancelled",
) {
  const userId = await requireCurrentUserId();
  const { data: before, error: beforeError } = await client
    .from("appointments")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.appointmentId)
    .single();

  if (beforeError) throw beforeError;

  const { data, error } = await client
    .from("appointments")
    .update({
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.appointmentId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType,
    entityType: "appointment",
    entityId: input.appointmentId,
    beforeData: before as Json,
    afterData: data as Json,
  });

  return data as AppointmentRow;
}
