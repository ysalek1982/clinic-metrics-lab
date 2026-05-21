import { ENCOUNTERS, PERMISSIONS, ROLES, SAAS_PATIENTS, TEAM_MEMBERS } from "@/data/saas";
import { SCREENING_EXECUTIONS } from "@/data/clinical";
import { calculateEnteralPlanMetrics } from "@/domain/clinical/enteralEngine";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import type {
  EncounterSnapshot,
  OrganizationUnit,
  Permission,
  Role,
  SaasPatientSnapshot,
  TeamMember,
} from "@/types/saas";

export interface ClinicalSourceResult<T> {
  source: "supabase" | "demo";
  data: T;
}

export interface ClinicalQueryOptions {
  allowDemo: boolean;
}

export interface PatientDetailBundle {
  patient: SaasPatientSnapshot | null;
  contacts: Array<{
    id: string;
    type: string;
    name: string | null;
    value: string;
    relationship: string | null;
    isPrimary: boolean;
  }>;
  encounters: EncounterSnapshot[];
  screenings: Array<{
    id: string;
    templateName: string;
    score: number;
    level: string;
    performedAt: string;
    recommendation: string | null;
  }>;
  anthropometrySessions: Array<{
    id: string;
    measuredAt: string;
    protocolId: string;
    qualityIndex: number | null;
  }>;
  notes: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
  }>;
  assessments: Array<{
    id: string;
    status: string;
    diagnosisProblem: string | null;
    conduct: string | null;
    createdAt: string;
  }>;
  plans: NutritionPlanSummary[];
  labOrders: Array<{
    id: string;
    orderedAt: string;
    resultedAt: string | null;
    status: string;
    provider: string | null;
    notes: string | null;
    outOfRangeCount: number;
    criticalCount: number;
  }>;
  labResults: Array<{
    id: string;
    labOrderId: string;
    markerCode: string;
    markerName: string;
    category: string;
    value: number | null;
    unit: string;
    referenceLow: number | null;
    referenceHigh: number | null;
    status: string;
    deltaValue: number | null;
    resultedAt: string | null;
  }>;
  ccorpLevel1Assessments: Array<{
    id: string;
    measuredAt: string;
    status: string;
    durninBodyFatPercent: number | null;
    durninFatMassKg: number | null;
    durninFatFreeMassKg: number | null;
    endomorphy: number | null;
    mesomorphy: number | null;
    ectomorphy: number | null;
  }>;
  sportsProfiles: Array<{
    id: string;
    patientId: string;
    discipline: string;
    category: string;
    position: string | null;
    objective: string | null;
    createdAt: string;
  }>;
  sportsAssessments: Array<{
    id: string;
    patientId: string;
    measuredAt: string;
    fatPct: number | null;
    leanMassKg: number | null;
    skeletalMuscleKg: number | null;
    endomorphy: number | null;
    mesomorphy: number | null;
    ectomorphy: number | null;
    notes: string | null;
  }>;
}

export interface TenantReferenceBundle {
  organizations: OrganizationUnit[];
}

export interface RolePermissionCatalog {
  roles: Role[];
  permissions: Permission[];
}

export interface NutritionPlanSummary {
  id: string;
  patientId: string;
  encounterId: string | null;
  type: string;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fluidsMl: number | null;
  diet: string | null;
  restrictions: string[];
  goals: string[];
  status: string;
  version: number;
  nextFollowUpAt: string | null;
  createdAt: string;
}

export interface AlertSummary {
  id: string;
  patientId: string;
  patientName: string;
  severity: "low" | "moderate" | "high" | "critical";
  type: "screening" | "follow_up" | "anthropometry" | "plan" | "labs" | "enteral";
  status: "active" | "reviewed" | "resolved" | "silenced" | "attended";
  message: string;
  createdAt: string;
  ward: string | null;
  sourceType: "screening" | "follow_up" | "anthropometry" | "plan" | "labs" | "enteral";
  sourceId: string | null;
}

export interface ReportRunSummary {
  id: string;
  reportType: string;
  reportName: string;
  format: string;
  status: string;
  createdAt: string;
  payload: Json;
}

export interface ClinicalAssessmentSummary {
  id: string;
  patientId: string;
  encounterId: string | null;
  status: string;
  diagnosisProblem: string | null;
  conduct: string | null;
  createdAt: string;
}

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

async function hasRemoteSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session.user);
}

async function canUseRemoteClinicalData(tenantId: string | null | undefined, options: ClinicalQueryOptions = {}) {
  if (supabase && tenantId && (await hasRemoteSession())) {
    return true;
  }

  if (options.allowDemo) {
    return false;
  }

  throw new Error("No hay sesión y tenant válidos para consultar datos clínicos reales.");
}

async function canUseRemoteIdentityCatalog(options: ClinicalQueryOptions = {}) {
  if (supabase && (await hasRemoteSession())) {
    return true;
  }

  if (options.allowDemo) {
    return false;
  }

  throw new Error("No hay sesión válida para consultar roles y permisos reales.");
}

function ageLabelFromBirthDate(birthDate: string | null) {
  if (!birthDate) return "--";
  const today = new Date();
  const birth = new Date(birthDate);
  const years = today.getFullYear() - birth.getFullYear();
  return `${Math.max(0, years)} a`;
}

function parseMetadata(metadata: Json | null | undefined) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata as Record<string, Json | undefined> : {};
}

function metadataString(metadata: Json | null | undefined, key: string) {
  const parsed = parseMetadata(metadata);
  return typeof parsed[key] === "string" ? parsed[key] : null;
}

async function getTenantReferenceMaps(tenantId: string) {
  const [organizations, branches, services] = await Promise.all([
    supabase!.from("organizations").select("*").eq("tenant_id", tenantId),
    supabase!.from("branches").select("*").eq("tenant_id", tenantId),
    supabase!.from("services").select("*").eq("tenant_id", tenantId),
  ]);

  return {
    organizations: new Map((organizations.data ?? []).map((item) => [item.id, item])),
    branches: new Map((branches.data ?? []).map((item) => [item.id, item])),
    services: new Map((services.data ?? []).map((item) => [item.id, item])),
  };
}

function mapPatientRow(
  row: PatientRow,
  refs: Awaited<ReturnType<typeof getTenantReferenceMaps>>,
  contacts: Array<{ type: string; value: string | null }> = [],
): SaasPatientSnapshot {
  const metadata = parseMetadata(row.metadata);
  const locationFromMetadata = typeof metadata.location === "string" ? metadata.location : undefined;
  const locationFromBranch = refs.branches.get(row.branch_id ?? "")?.name;
  const contactValue = (type: string) => contacts.find((contact) => contact.type === type)?.value ?? null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    organizationId: row.organization_id,
    branchId: row.branch_id ?? "",
    serviceId: row.service_id ?? "",
    mrn: row.mrn,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    birthDate: row.birth_date,
    ageLabel: ageLabelFromBirthDate(row.birth_date),
    sex: row.sex as SaasPatientSnapshot["sex"],
    primaryPack: (row.primary_pack_id ?? "clinical") as SaasPatientSnapshot["primaryPack"],
    activePacks: (row.active_pack_ids ?? ["clinical"]) as SaasPatientSnapshot["activePacks"],
    risk: row.risk_level as SaasPatientSnapshot["risk"],
    status: row.status as SaasPatientSnapshot["status"],
    diagnosisSummary: row.diagnosis_summary ?? "Sin diagnóstico resumido",
    location: row.location_label ?? locationFromMetadata ?? locationFromBranch ?? "Sin ubicación",
    lastEvaluationAt: row.last_evaluation_at ?? row.created_at.slice(0, 10),
    nextFollowUpAt: row.next_follow_up_at ?? row.created_at.slice(0, 10),
    phone: contactValue("phone"),
    email: contactValue("email"),
    address: contactValue("address"),
  };
}

export async function getTenantReferenceBundle(tenantId: string | null, options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<TenantReferenceBundle>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: { organizations: [] } };
  }

  const [organizations, branches, departments, services] = await Promise.all([
    supabase.from("organizations").select("*").eq("tenant_id", tenantId).order("name"),
    supabase.from("branches").select("*").eq("tenant_id", tenantId).order("name"),
    supabase.from("departments").select("*").eq("tenant_id", tenantId).order("name"),
    supabase.from("services").select("*").eq("tenant_id", tenantId).order("name"),
  ]);

  if (organizations.error || branches.error || departments.error || services.error) {
    throw organizations.error ?? branches.error ?? departments.error ?? services.error;
  }

  const branchRows = branches.data ?? [];
  const departmentRows = departments.data ?? [];
  const serviceRows = services.data ?? [];

  return {
    source: "supabase",
    data: {
      organizations: (organizations.data ?? []).map((organization) => ({
        id: organization.id,
        tenantId: organization.tenant_id,
        name: organization.name,
        type: organization.type as OrganizationUnit["type"],
        branches: branchRows
          .filter((branch) => branch.organization_id === organization.id)
          .map((branch) => ({
            id: branch.id,
            tenantId: branch.tenant_id,
            organizationId: branch.organization_id,
            name: branch.name,
            city: branch.city ?? "",
            timezone: branch.timezone,
            status: branch.status as "active" | "inactive",
          })),
        departments: departmentRows
          .filter((department) => department.organization_id === organization.id)
          .map((department) => ({
            id: department.id,
            tenantId: department.tenant_id,
            organizationId: department.organization_id,
            branchId: department.branch_id,
            name: department.name,
            clinicalArea: department.clinical_area,
          })),
        services: serviceRows
          .filter((service) =>
            departmentRows.some((department) => department.id === service.department_id && department.organization_id === organization.id),
          )
          .map((service) => ({
            id: service.id,
            tenantId: service.tenant_id,
            departmentId: service.department_id,
            name: service.name,
            defaultPack: (service.default_pack_id ?? "clinical") as OrganizationUnit["services"][number]["defaultPack"],
            careSetting: service.care_setting as OrganizationUnit["services"][number]["careSetting"],
          })),
      })),
    },
  };
}

export async function getPatientsForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<SaasPatientSnapshot[]>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: tenantId ? SAAS_PATIENTS.filter((patient) => patient.tenantId === tenantId) : SAAS_PATIENTS };
  }

  const refs = await getTenantReferenceMaps(tenantId);
  const [{ data, error }, contactsResult] = await Promise.all([
    supabase
      .from("patients")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("last_name"),
    supabase
      .from("patient_contacts")
      .select("patient_id,type,value")
      .eq("tenant_id", tenantId)
      .in("type", ["phone", "email", "address"]),
  ]);

  if (error || contactsResult.error || !data) {
    throw error ?? contactsResult.error ?? new Error("No se pudieron cargar pacientes.");
  }

  const contactsByPatient = new Map<string, Array<{ type: string; value: string | null }>>();
  (contactsResult.data ?? []).forEach((contact) => {
    contactsByPatient.set(contact.patient_id, [...(contactsByPatient.get(contact.patient_id) ?? []), contact]);
  });

  return {
    source: "supabase",
    data: data.map((row) => mapPatientRow(row, refs, contactsByPatient.get(row.id))),
  };
}

export async function getEncountersForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<EncounterSnapshot[]>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: tenantId ? ENCOUNTERS.filter((encounter) => encounter.tenantId === tenantId) : ENCOUNTERS };
  }

  const { data, error } = await supabase
    .from("encounters")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("opened_at", { ascending: false });

  if (error || !data) {
    throw error ?? new Error("No se pudieron cargar episodios.");
  }

  return {
    source: "supabase",
    data: data.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      patientId: row.patient_id,
      type: row.type as EncounterSnapshot["type"],
      title: row.title,
      status: row.status as EncounterSnapshot["status"],
      openedAt: row.opened_at.slice(0, 10),
      ownerId: row.owner_user_id ?? "",
      notes: metadataString(row.metadata, "notes"),
    })),
  };
}

export async function getScreeningResultsForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}) {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return {
      source: "demo" as const,
      data: tenantId ? SCREENING_EXECUTIONS.filter((execution) => execution.tenantId === tenantId) : SCREENING_EXECUTIONS,
    };
  }

  const [results, templates] = await Promise.all([
    supabase.from("screening_results").select("*").eq("tenant_id", tenantId).order("performed_at", { ascending: false }),
    supabase.from("screening_templates").select("id,name,version"),
  ]);

  if (results.error || templates.error) {
    throw results.error ?? templates.error;
  }

  const templateMap = new Map((templates.data ?? []).map((item) => [item.id, item]));

  return {
    source: "supabase" as const,
    data: (results.data ?? []).map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      patientId: row.patient_id,
      templateId: row.template_id,
      score: Number(row.score),
      level: row.risk_level,
      flags: row.flags,
      recommendation: row.recommendation,
      nextReviewDays: row.next_review_at
        ? Math.max(
            0,
            Math.ceil((new Date(row.next_review_at).getTime() - new Date(row.performed_at).getTime()) / (1000 * 60 * 60 * 24)),
          )
        : 0,
      date: row.performed_at.slice(0, 10),
      templateName: templateMap.get(row.template_id)?.name ?? row.template_id,
      templateVersion: templateMap.get(row.template_id)?.version ?? row.template_version,
    })),
  };
}

export async function getTeamForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<TeamMember[]>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: tenantId ? TEAM_MEMBERS.filter((member) => member.tenantId === tenantId) : TEAM_MEMBERS };
  }

  const [memberships, profiles, membershipRoles, roles, scopes] = await Promise.all([
    supabase.from("tenant_memberships").select("*").eq("tenant_id", tenantId),
    supabase.from("user_profiles").select("*"),
    supabase.from("membership_roles").select("*"),
    supabase.from("roles").select("*"),
    supabase.from("membership_scopes").select("*"),
  ]);

  if (memberships.error || profiles.error || membershipRoles.error || roles.error || scopes.error) {
    throw memberships.error ?? profiles.error ?? membershipRoles.error ?? roles.error ?? scopes.error;
  }

  const profileMap = new Map((profiles.data ?? []).map((item) => [item.id, item]));
  const roleMap = new Map((roles.data ?? []).map((item) => [item.id, item]));

  const mapped: TeamMember[] = (memberships.data ?? []).map((membership) => {
    const profile = profileMap.get(membership.user_id);
    const roleIds = (membershipRoles.data ?? [])
      .filter((item) => item.membership_id === membership.id)
      .map((item) => roleMap.get(item.role_id)?.code ?? item.role_id);
    const membershipScopes = (scopes.data ?? []).filter((item) => item.membership_id === membership.id);

    return {
      id: membership.user_id,
      tenantId: membership.tenant_id,
      name: profile?.full_name ?? membership.user_id,
      email: profile?.email ?? "",
      initials: profile?.initials ?? "US",
      title: membership.title ?? profile?.title ?? "Miembro del tenant",
      roleIds,
      branchIds: membershipScopes.map((item) => item.branch_id).filter((item): item is string => Boolean(item)),
      serviceIds: membershipScopes.map((item) => item.service_id).filter((item): item is string => Boolean(item)),
      status: membership.status as TeamMember["status"],
      lastActiveAt: membership.updated_at,
    };
  });

  return { source: "supabase", data: mapped };
}

export async function getRolePermissionCatalog(options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<RolePermissionCatalog>> {
  if (!(await canUseRemoteIdentityCatalog(options))) {
    return {
      source: "demo",
      data: {
        roles: ROLES,
        permissions: PERMISSIONS,
      },
    };
  }

  const [roles, permissions, rolePermissions] = await Promise.all([
    supabase.from("roles").select("*").order("name"),
    supabase.from("permissions").select("*").order("id"),
    supabase.from("role_permissions").select("*"),
  ]);

  if (roles.error || permissions.error || rolePermissions.error) {
    if (await hasRemoteSession()) {
      throw roles.error ?? permissions.error ?? rolePermissions.error ?? new Error("No se pudo cargar el catálogo de roles y permisos.");
    }

    return {
      source: "demo",
      data: {
        roles: ROLES,
        permissions: PERMISSIONS,
      },
    };
  }

  const permissionRows = permissions.data ?? [];
  const rolePermissionRows = rolePermissions.data ?? [];

  return {
    source: "supabase",
    data: {
      roles: (roles.data ?? []).map((role) => ({
        id: role.code,
        tenantId: role.tenant_id ?? undefined,
        name: role.name,
        description: role.description,
        level: role.level as Role["level"],
        baseRole: role.is_system,
        permissions: rolePermissionRows
          .filter((item) => item.role_id === role.id)
          .map((item) => item.permission_id),
      })),
      permissions: permissionRows.map((permission) => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action as Permission["action"],
        scope: permission.scope as Permission["scope"],
        description: permission.description,
      })),
    },
  };
}

export async function getTenantInvites(tenantId: string | null, options: ClinicalQueryOptions = {}) {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo" as const, data: [] };
  }

  const { data, error } = await supabase
    .from("tenant_invites")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) {
    throw error ?? new Error("No se pudieron cargar invitaciones.");
  }

  return { source: "supabase" as const, data };
}

export async function getPatientDetailBundle(
  tenantId: string | null | undefined,
  patientId: string | null | undefined,
  options: ClinicalQueryOptions = {},
): Promise<ClinicalSourceResult<PatientDetailBundle>> {
  if (!patientId || !(await canUseRemoteClinicalData(tenantId, options))) {
    const patient = SAAS_PATIENTS.find((item) => item.id === patientId) ?? SAAS_PATIENTS[0] ?? null;
    return {
      source: "demo",
      data: {
        patient,
        contacts: [],
        encounters: patient ? ENCOUNTERS.filter((item) => item.patientId === patient.id) : [],
        screenings: patient ? SCREENING_EXECUTIONS.filter((item) => item.patientId === patient.id).map((item) => ({
          id: item.id,
          templateName: item.templateId,
          score: item.score,
          level: item.level,
          performedAt: item.date,
          recommendation: item.recommendation,
        })) : [],
        anthropometrySessions: [],
        notes: [],
        assessments: [],
        plans: [],
        labOrders: [],
        labResults: [],
        ccorpLevel1Assessments: [],
        sportsProfiles: [],
        sportsAssessments: [],
      },
    };
  }

  const refs = await getTenantReferenceMaps(tenantId);
  const [
    patientResult,
    contactsResult,
    encountersResult,
    screeningsResult,
    screeningTemplatesResult,
    anthroSessionsResult,
    notesResult,
    assessmentsResult,
    plansResult,
    labOrdersResult,
    labResultsResult,
    ccorpAssessmentsResult,
    ccorpResultsResult,
    sportsProfilesResult,
    sportsSnapshotsResult,
  ] = await Promise.all([
    supabase.from("patients").select("*").eq("tenant_id", tenantId).eq("id", patientId).maybeSingle(),
    supabase.from("patient_contacts").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("is_primary", { ascending: false }),
    supabase.from("encounters").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("opened_at", { ascending: false }),
    supabase.from("screening_results").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("performed_at", { ascending: false }),
    supabase.from("screening_templates").select("id,name"),
    supabase.from("anthropometry_sessions").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("measured_at", { ascending: false }),
    supabase.from("clinical_notes").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("created_at", { ascending: false }),
    supabase.from("clinical_assessments").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("created_at", { ascending: false }),
    supabase.from("nutrition_plans").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("created_at", { ascending: false }),
    supabase.from("lab_orders").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).is("deleted_at", null).order("resulted_at", { ascending: false }),
    supabase.from("lab_results").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("resulted_at", { ascending: false }),
    supabase.from("ccorp_level1_assessments").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).is("deleted_at", null).order("measured_at", { ascending: false }),
    supabase.from("ccorp_level1_results").select("*").eq("tenant_id", tenantId),
    supabase.from("sports_profiles").select("*").eq("tenant_id", tenantId).eq("patient_id", patientId).order("created_at", { ascending: false }),
    supabase
      .from("sports_bodycomp_snapshots")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("patient_id", patientId)
      .order("measured_at", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (
    patientResult.error ||
    contactsResult.error ||
    encountersResult.error ||
    screeningsResult.error ||
    screeningTemplatesResult.error ||
    anthroSessionsResult.error ||
    notesResult.error ||
    assessmentsResult.error ||
    plansResult.error ||
    labOrdersResult.error ||
    labResultsResult.error ||
    ccorpAssessmentsResult.error ||
    ccorpResultsResult.error ||
    sportsProfilesResult.error ||
    sportsSnapshotsResult.error
  ) {
    throw patientResult.error ??
      contactsResult.error ??
      encountersResult.error ??
      screeningsResult.error ??
      screeningTemplatesResult.error ??
      anthroSessionsResult.error ??
      notesResult.error ??
      assessmentsResult.error ??
      plansResult.error ??
      labOrdersResult.error ??
      labResultsResult.error ??
      ccorpAssessmentsResult.error ??
      ccorpResultsResult.error ??
      sportsProfilesResult.error ??
      sportsSnapshotsResult.error;
  }

  const templateMap = new Map((screeningTemplatesResult.data ?? []).map((item) => [item.id, item.name]));
  const patient = patientResult.data ? mapPatientRow(patientResult.data, refs) : null;
  const ccorpResultMap = new Map((ccorpResultsResult.data ?? []).map((row) => [row.assessment_id, row]));

  return {
    source: "supabase",
    data: {
      patient,
      contacts: (contactsResult.data ?? []).map((row) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        value: row.value,
        relationship: row.relationship,
        isPrimary: row.is_primary,
      })),
      encounters: (encountersResult.data ?? []).map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        patientId: row.patient_id,
        type: row.type as EncounterSnapshot["type"],
        title: row.title,
        status: row.status as EncounterSnapshot["status"],
        openedAt: row.opened_at.slice(0, 10),
        ownerId: row.owner_user_id ?? "",
        notes: metadataString(row.metadata, "notes"),
      })),
      screenings: (screeningsResult.data ?? []).map((row) => ({
        id: row.id,
        templateName: templateMap.get(row.template_id) ?? row.template_id,
        score: row.score,
        level: row.risk_level,
        performedAt: row.performed_at,
        recommendation: row.recommendation,
      })),
      anthropometrySessions: (anthroSessionsResult.data ?? []).map((row) => ({
        id: row.id,
        measuredAt: row.measured_at,
        protocolId: row.protocol_id,
        qualityIndex: row.quality_index,
      })),
      notes: (notesResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        createdAt: row.created_at,
      })),
      assessments: (assessmentsResult.data ?? []).map((row) => ({
        id: row.id,
        status: row.status,
        diagnosisProblem: row.diagnosis_problem,
        conduct: row.conduct,
        createdAt: row.created_at,
      })),
      plans: (plansResult.data ?? []).map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        encounterId: row.encounter_id,
        type: row.type,
        kcal: row.kcal,
        proteinG: row.protein_g,
        carbsG: row.carbs_g,
        fatG: row.fat_g,
        fluidsMl: row.fluids_ml,
        diet: row.diet,
        restrictions: row.restrictions,
        goals: Array.isArray(row.goals) ? row.goals.filter((item): item is string => typeof item === "string") : [],
        status: row.status,
        version: row.version,
        nextFollowUpAt: row.next_follow_up_at,
        createdAt: row.created_at,
      })),
      labOrders: (labOrdersResult.data ?? []).map((row) => {
        const orderResults = (labResultsResult.data ?? []).filter((result) => result.lab_order_id === row.id);
        return {
          id: row.id,
          orderedAt: row.ordered_at,
          resultedAt: row.resulted_at,
          status: row.status,
          provider: row.provider,
          notes: row.notes,
          outOfRangeCount: orderResults.filter((result) => result.status === "out_of_range").length,
          criticalCount: orderResults.filter((result) => result.status === "critical").length,
        };
      }),
      labResults: (labResultsResult.data ?? []).map((row) => ({
        id: row.id,
        labOrderId: row.lab_order_id,
        markerCode: row.marker_code,
        markerName: row.marker_name,
        category: row.category,
        value: row.value,
        unit: row.unit,
        referenceLow: row.reference_low,
        referenceHigh: row.reference_high,
        status: row.status,
        deltaValue: row.delta_value,
        resultedAt: row.resulted_at,
      })),
      ccorpLevel1Assessments: (ccorpAssessmentsResult.data ?? []).map((row) => {
        const result = ccorpResultMap.get(row.id);
        return {
          id: row.id,
          measuredAt: row.measured_at,
          status: row.status,
          durninBodyFatPercent: typeof result?.durnin_body_fat_percent === "number" ? result.durnin_body_fat_percent : null,
          durninFatMassKg: typeof result?.durnin_fat_mass_kg === "number" ? result.durnin_fat_mass_kg : null,
          durninFatFreeMassKg: typeof result?.durnin_fat_free_mass_kg === "number" ? result.durnin_fat_free_mass_kg : null,
          endomorphy: typeof result?.endomorphy === "number" ? result.endomorphy : null,
          mesomorphy: typeof result?.mesomorphy === "number" ? result.mesomorphy : null,
          ectomorphy: typeof result?.ectomorphy === "number" ? result.ectomorphy : null,
        };
      }),
      sportsProfiles: (sportsProfilesResult.data ?? []).map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        discipline: row.discipline,
        category: row.category,
        position: row.position,
        objective: row.objective,
        createdAt: row.created_at,
      })),
      sportsAssessments: (sportsSnapshotsResult.data ?? []).map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        measuredAt: row.measured_at,
        fatPct: row.fat_pct,
        leanMassKg: row.lean_mass_kg,
        skeletalMuscleKg: row.skeletal_muscle_kg,
        endomorphy: row.endomorphy,
        mesomorphy: row.mesomorphy,
        ectomorphy: row.ectomorphy,
        notes: row.notes,
      })),
    },
  };
}

export async function getAuditEventsForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}) {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo" as const, data: [] };
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    throw error ?? new Error("No se pudo cargar auditora.");
  }

  return {
    source: "supabase" as const,
    data,
  };
}

async function currentUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function createPatient(input: {
  tenantId: string;
  organizationId: string;
  branchId: string | null;
  serviceId: string | null;
  mrn: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  sex: "female" | "male" | "other";
  primaryPackId: string;
  activePackIds: string[];
  diagnosisSummary: string | null;
  locationLabel: string | null;
  nextFollowUpAt: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactsTouched: boolean;
}) {
  if (!supabase) throw new Error("Supabase no est configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      tenant_id: input.tenantId,
      organization_id: input.organizationId,
      branch_id: input.branchId ?? null,
      service_id: input.serviceId ?? null,
      mrn: input.mrn,
      first_name: input.firstName,
      last_name: input.lastName,
      birth_date: input.birthDate ?? null,
      sex: input.sex,
      primary_pack_id: input.primaryPackId,
      active_pack_ids: input.activePackIds,
      diagnosis_summary: input.diagnosisSummary ?? null,
      location_label: input.locationLabel ?? null,
      next_follow_up_at: input.nextFollowUpAt ?? null,
      created_by: actorUserId,
      updated_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo crear paciente.");

  const phoneValue = input.phone?.trim() ?? "";
  const emailValue = input.email?.trim() ?? "";
  const addressValue = input.address?.trim() ?? "";

  const contacts = [
    phoneValue
      ? {
          tenant_id: input.tenantId,
          patient_id: data.id,
          type: "phone",
          name: "Teléfono principal",
          value: phoneValue,
          relationship: "paciente",
          is_primary: true,
        }
      : null,
    emailValue
      ? {
          tenant_id: input.tenantId,
          patient_id: data.id,
          type: "email",
          name: "Correo principal",
          value: emailValue,
          relationship: "paciente",
          is_primary: !phoneValue,
        }
      : null,
    addressValue
      ? {
          tenant_id: input.tenantId,
          patient_id: data.id,
          type: "address",
          name: "Dirección",
          value: addressValue,
          relationship: "paciente",
          is_primary: false,
        }
      : null,
  ].filter((contact): contact is NonNullable<typeof contact> => Boolean(contact));

  if (contacts.length > 0) {
    const { error: contactsError } = await supabase.from("patient_contacts").insert(contacts);
    if (contactsError) throw contactsError;
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "patient.create",
    entityType: "patients",
    entityId: data.id,
    afterData: { mrn: data.mrn, first_name: data.first_name, last_name: data.last_name },
  });

  return data;
}

export async function updatePatient(input: {
  tenantId: string;
  patientId: string;
  organizationId: string;
  branchId: string | null;
  serviceId: string | null;
  mrn: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  sex: "female" | "male" | "other";
  status: string;
  riskLevel: string;
  primaryPackId: string;
  activePackIds: string[];
  diagnosisSummary: string | null;
  locationLabel: string | null;
  nextFollowUpAt: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contactsTouched?: boolean;
}) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase
    .from("patients")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.patientId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("patients")
    .update({
      organization_id: input.organizationId,
      branch_id: input.branchId ?? null,
      service_id: input.serviceId ?? null,
      mrn: input.mrn,
      first_name: input.firstName,
      last_name: input.lastName,
      birth_date: input.birthDate ?? null,
      sex: input.sex,
      status: input.status,
      risk_level: input.riskLevel,
      primary_pack_id: input.primaryPackId,
      active_pack_ids: input.activePackIds,
      diagnosis_summary: input.diagnosisSummary ?? null,
      location_label: input.locationLabel ?? null,
      next_follow_up_at: input.nextFollowUpAt ?? null,
      updated_by: actorUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.patientId)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo actualizar el paciente.");

  if (input.contactsTouched) {
    const phoneValue = input.phone?.trim() ?? "";
    const emailValue = input.email?.trim() ?? "";
    const addressValue = input.address?.trim() ?? "";

    const { error: deleteContactsError } = await supabase
      .from("patient_contacts")
      .delete()
      .eq("tenant_id", input.tenantId)
      .eq("patient_id", input.patientId)
      .in("type", ["phone", "email", "address"]);

    if (deleteContactsError) throw deleteContactsError;

    const contacts = [
      phoneValue
        ? {
            tenant_id: input.tenantId,
            patient_id: input.patientId,
            type: "phone",
            name: "Teléfono principal",
            value: phoneValue,
            relationship: "paciente",
            is_primary: true,
          }
        : null,
      emailValue
        ? {
            tenant_id: input.tenantId,
            patient_id: input.patientId,
            type: "email",
            name: "Correo principal",
            value: emailValue,
            relationship: "paciente",
            is_primary: !phoneValue,
          }
        : null,
      addressValue
        ? {
            tenant_id: input.tenantId,
            patient_id: input.patientId,
            type: "address",
            name: "Dirección",
            value: addressValue,
            relationship: "paciente",
            is_primary: false,
          }
        : null,
    ].filter((contact): contact is NonNullable<typeof contact> => Boolean(contact));

    if (contacts.length > 0) {
      const { error: contactsError } = await supabase.from("patient_contacts").insert(contacts);
      if (contactsError) throw contactsError;
    }
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "patient.update",
    entityType: "patients",
    entityId: data.id,
    beforeData: beforeData ?? null,
    afterData: {
      mrn: data.mrn,
      first_name: data.first_name,
      last_name: data.last_name,
      status: data.status,
      risk_level: data.risk_level,
      diagnosis_summary: data.diagnosis_summary,
      location_label: data.location_label,
      next_follow_up_at: data.next_follow_up_at,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
    },
  });

  return data;
}

export async function createEncounter(input: {
  tenantId: string;
  patientId: string;
  type: string;
  title: string;
  ownerUserId: string | null;
}) {
  if (!supabase) throw new Error("Supabase no est configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("encounters")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      type: input.type,
      title: input.title,
      owner_user_id: input.ownerUserId ?? actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo crear episodio.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "encounter.create",
    entityType: "encounters",
    entityId: data.id,
    afterData: { title: data.title, type: data.type },
  });

  return data;
}

export async function updateEncounter(input: {
  tenantId: string;
  encounterId: string;
  patientId: string;
  type: string;
  title: string;
  status: string;
  openedAt: string;
  notes: string | null;
  ownerUserId: string | null;
}) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase
    .from("encounters")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.encounterId)
    .maybeSingle();

  const metadata = beforeData && typeof beforeData.metadata === "object" && !Array.isArray(beforeData.metadata)
    ? { ...beforeData.metadata, notes: input.notes ?? null }
    : { notes: input.notes ?? null };

  const { data, error } = await supabase
    .from("encounters")
    .update({
      patient_id: input.patientId,
      type: input.type,
      title: input.title,
      status: input.status,
      opened_at: input.openedAt,
      closed_at: input.status === "closed" ? new Date().toISOString() : null,
      owner_user_id: input.ownerUserId ?? actorUserId,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.encounterId)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo actualizar el episodio.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: input.status === "closed" ? "encounter.closed" : "encounter.update",
    entityType: "encounters",
    entityId: data.id,
    beforeData: beforeData ?? null,
    afterData: { title: data.title, type: data.type, status: data.status, opened_at: data.opened_at },
  });

  return data;
}

export async function getNutritionPlansForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<NutritionPlanSummary[]>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: [] };
  }

  const { data, error } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw error ?? new Error("No se pudieron cargar los planes nutricionales.");
  }

  return {
    source: "supabase",
    data: data.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      encounterId: row.encounter_id,
      type: row.type,
      kcal: row.kcal,
      proteinG: row.protein_g,
      carbsG: row.carbs_g,
      fatG: row.fat_g,
      fluidsMl: row.fluids_ml,
      diet: row.diet,
      restrictions: row.restrictions,
      goals: Array.isArray(row.goals) ? row.goals.filter((item): item is string => typeof item === "string") : [],
      status: row.status,
      version: row.version,
      nextFollowUpAt: row.next_follow_up_at ?? null,
      createdAt: row.created_at,
    })),
  };
}

export async function createNutritionPlan(input: {
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  type: string;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fluidsMl: number | null;
  diet: string | null;
  restrictions: string[];
  goals: string[];
  status: string;
  nextFollowUpAt?: string | null;
}) {
  if (!supabase) throw new Error("Supabase no est configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("nutrition_plans")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      type: input.type,
      kcal: input.kcal ?? null,
      protein_g: input.proteinG ?? null,
      carbs_g: input.carbsG ?? null,
      fat_g: input.fatG ?? null,
      fluids_ml: input.fluidsMl ?? null,
      diet: input.diet ?? null,
      restrictions: input.restrictions ?? [],
      goals: input.goals ?? [],
      status: input.status ?? "draft",
      next_follow_up_at: input.nextFollowUpAt ?? null,
      created_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo guardar el plan nutricional.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "nutrition_plan.create",
    entityType: "nutrition_plans",
    entityId: data.id,
    afterData: { type: data.type, status: data.status, kcal: data.kcal },
  });

  return data;
}

export async function updateNutritionPlan(input: {
  tenantId: string;
  planId: string;
  patientId: string;
  encounterId: string | null;
  type: string;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fluidsMl: number | null;
  diet: string | null;
  restrictions: string[];
  goals: string[];
  status: string;
  nextFollowUpAt: string | null;
}) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const actorUserId = await currentUserId();
  const { data: beforeData } = await supabase
    .from("nutrition_plans")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("nutrition_plans")
    .update({
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      type: input.type,
      kcal: input.kcal ?? null,
      protein_g: input.proteinG ?? null,
      carbs_g: input.carbsG ?? null,
      fat_g: input.fatG ?? null,
      fluids_ml: input.fluidsMl ?? null,
      diet: input.diet ?? null,
      restrictions: input.restrictions ?? [],
      goals: input.goals ?? [],
      status: input.status ?? "draft",
      next_follow_up_at: input.nextFollowUpAt ?? null,
      version: Number(beforeData?.version ?? 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.planId)
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo actualizar el plan nutricional.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType:
      input.status === "paused"
        ? "nutrition_plan.paused"
        : input.status === "completed" || input.status === "closed"
          ? "nutrition_plan.closed"
          : "nutrition_plan.update",
    entityType: "nutrition_plans",
    entityId: data.id,
    beforeData: beforeData ?? null,
    afterData: { type: data.type, status: data.status, kcal: data.kcal, version: data.version },
  });

  return data;
}

export async function getAlertsForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<AlertSummary[]>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: [] };
  }

  const [patients, screenings, anthroSessions, plans, labResults, enteralPlans, enteralLogs] = await Promise.all([
    getPatientsForTenant(tenantId),
    getScreeningResultsForTenant(tenantId),
    supabase.from("anthropometry_sessions").select("*").eq("tenant_id", tenantId).order("measured_at", { ascending: false }).limit(20),
    getNutritionPlansForTenant(tenantId),
    supabase
      .from("lab_results")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("status", ["critical", "out_of_range"])
      .order("resulted_at", { ascending: false })
      .limit(100),
    supabase.from("enteral_plans").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("enteral_daily_logs").select("*").eq("tenant_id", tenantId).order("logged_at", { ascending: false }).limit(200),
  ]);

  if (anthroSessions.error || labResults.error || enteralPlans.error || enteralLogs.error) {
    throw anthroSessions.error ?? labResults.error ?? enteralPlans.error ?? enteralLogs.error;
  }

  const patientMap = new Map((patients.data ?? []).map((patient) => [patient.id, patient]));
  const alerts: Array<Omit<AlertSummary, "status">> = [];

  for (const screening of screenings.data ?? []) {
    const patient = patientMap.get(screening.patientId);
    if (!patient) continue;

    if (screening.level === "high" || screening.level === "critical") {
      alerts.push({
        id: `screening-${screening.id}`,
        patientId: screening.patientId,
        patientName: patient.fullName,
        severity: screening.level,
        type: "screening",
        message: screening.recommendation ?? `Screening ${screening.templateName} con puntaje ${screening.score}.`,
        createdAt: screening.date,
        ward: patient.location,
        sourceType: "screening",
        sourceId: screening.id,
      });
    }
  }

  for (const patient of patients.data ?? []) {
    const dueDate = patient.nextFollowUpAt ? new Date(patient.nextFollowUpAt) : null;
    if (dueDate && dueDate.getTime() < Date.now()) {
      alerts.push({
        id: `followup-${patient.id}`,
        patientId: patient.id,
        patientName: patient.fullName,
        severity: patient.risk === "critical" ? "critical" : patient.risk === "high" ? "high" : "moderate",
        type: "follow_up",
        message: `Seguimiento vencido para ${patient.fullName}.`,
        createdAt: patient.nextFollowUpAt,
        ward: patient.location,
        sourceType: "follow_up",
        sourceId: patient.id,
      });
    }
  }

  for (const session of anthroSessions.data ?? []) {
    if ((session.quality_index ?? 100) < 70) {
      const patient = patientMap.get(session.patient_id);
      if (!patient) continue;
      alerts.push({
        id: `anthro-${session.id}`,
        patientId: session.patient_id,
        patientName: patient.fullName,
        severity: "moderate",
        type: "anthropometry",
        message: `Sesión antropométrica con índice de calidad ${session.quality_index ?? 0}.`,
        createdAt: session.measured_at,
        ward: patient.location,
        sourceType: "anthropometry",
        sourceId: session.id,
      });
    }
  }

  for (const plan of plans.data ?? []) {
    if (plan.status === "draft") {
      const patient = patientMap.get(plan.patientId);
      if (!patient) continue;
      alerts.push({
        id: `plan-${plan.id}`,
        patientId: patient.id,
        patientName: patient.fullName,
        severity: "low",
        type: "plan",
        message: `Plan nutricional en borrador pendiente de validación (${plan.type}).`,
        createdAt: plan.createdAt,
        ward: patient.location,
        sourceType: "plan",
        sourceId: plan.id,
      });
    }
  }

  const latestLabAlertByPatientMarker = new Set<string>();
  for (const result of labResults.data ?? []) {
    const patientId = String(result.patient_id);
    const markerCode = String(result.marker_code);
    const uniqueKey = `${patientId}:${markerCode}`;
    if (latestLabAlertByPatientMarker.has(uniqueKey)) continue;
    latestLabAlertByPatientMarker.add(uniqueKey);

    const patient = patientMap.get(patientId);
    if (!patient) continue;

    const status = String(result.status);
    const isCritical = status === "critical";
    const value = result.value === null || result.value === undefined ? "pendiente" : `${result.value} ${result.unit}`;
    const range =
      result.reference_low !== null && result.reference_high !== null
        ? `rango ${result.reference_low}-${result.reference_high} ${result.unit}`
        : "rango de referencia pendiente";

    alerts.push({
      id: `lab-${result.id}`,
      patientId,
      patientName: patient.fullName,
      severity: isCritical ? "critical" : "high",
      type: "labs",
      message: `${result.marker_name}: ${value}; ${range}.`,
      createdAt: result.resulted_at ?? result.created_at,
      ward: patient.location,
      sourceType: "labs",
      sourceId: result.id,
    });
  }

  const latestEnteralLogByPlan = new Map<string, Record<string, unknown>>();
  for (const row of enteralLogs.data ?? []) {
    const planId = String(row.plan_id);
    if (!latestEnteralLogByPlan.has(planId)) latestEnteralLogByPlan.set(planId, row as Record<string, unknown>);
  }

  for (const planRow of enteralPlans.data ?? []) {
    const plan = planRow as Record<string, unknown>;
    const latestLog = latestEnteralLogByPlan.get(String(plan.id));
    if (!latestLog) continue;

    const patientId = String(plan.patient_id);
    const patient = patientMap.get(patientId);
    if (!patient) continue;

    const numberValue = (row: Record<string, unknown>, key: string) => {
      const value = row[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const metrics = calculateEnteralPlanMetrics({
      targetVolumeMl: numberValue(plan, "target_volume_ml") ?? numberValue(plan, "volume_ml"),
      targetKcal: numberValue(plan, "target_kcal") ?? numberValue(plan, "kcal"),
      targetProteinG: numberValue(plan, "target_protein_g") ?? numberValue(plan, "protein_g"),
      deliveredVolumeMl: numberValue(latestLog, "delivered_volume_ml"),
      deliveredKcal: numberValue(latestLog, "delivered_kcal"),
      deliveredProteinG: numberValue(latestLog, "delivered_protein_g"),
      adherencePct: numberValue(latestLog, "adherence_pct"),
      vomiting: latestLog.vomiting === true,
      diarrhea: latestLog.diarrhea === true,
      abdominalDistension: latestLog.abdominal_distension === true || latestLog.distension === true,
      aspirationEvent: latestLog.aspiration_event === true,
      manualToleranceStatus: typeof latestLog.tolerance_status === "string" ? latestLog.tolerance_status : typeof plan.tolerance_status === "string" ? plan.tolerance_status : null,
    });

    if (metrics.toleranceStatus === "good") continue;

    const severity: AlertSummary["severity"] =
      metrics.toleranceStatus === "critical" ? "critical" : metrics.toleranceStatus === "poor" ? "high" : "moderate";
    const flagText = metrics.flags.length > 0 ? metrics.flags.join(", ") : "tolerancia en observación";
    alerts.push({
      id: `enteral-${latestLog.id}`,
      patientId,
      patientName: patient.fullName,
      severity,
      type: "enteral",
      message: `Soporte enteral: ${flagText}${metrics.volumeDeliveredPct != null ? `; volumen ${metrics.volumeDeliveredPct}%` : ""}.`,
      createdAt: String(latestLog.logged_at ?? latestLog.created_at ?? plan.created_at),
      ward: patient.location,
      sourceType: "enteral",
      sourceId: String(latestLog.id),
    });
  }

  const { data: acknowledgementRows, error: acknowledgementError } = await supabase
    .from("alert_acknowledgements")
    .select("*")
    .eq("tenant_id", tenantId);

  if (acknowledgementError) throw acknowledgementError;

  const acknowledgementMap = new Map(
    (acknowledgementRows ?? []).map((row) => {
      const status = String(row.status);
      const normalizedStatus: AlertSummary["status"] =
        status === "resolved" || status === "reviewed" || status === "silenced" || status === "attended"
          ? status
          : "active";
      return [String(row.alert_id), normalizedStatus];
    }),
  );

  const alertsWithStatus = alerts
    .map((alert) => ({
      ...alert,
      status: acknowledgementMap.get(alert.id) ?? "active",
    }));

  const statusOrder: Record<AlertSummary["status"], number> = {
    active: 0,
    attended: 1,
    reviewed: 2,
    silenced: 3,
    resolved: 4,
  };

  return {
    source: "supabase",
    data: alertsWithStatus.sort((left, right) => {
      const statusDelta = statusOrder[left.status] - statusOrder[right.status];
      if (statusDelta !== 0) return statusDelta;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }),
  };
}

export async function acknowledgeAlert(input: {
  tenantId: string;
  alertId: string;
  patientId: string | null;
  status: Exclude<AlertSummary["status"], "active">;
  note?: string | null;
  sourceType?: AlertSummary["sourceType"] | null;
  sourceId?: string | null;
  priority?: AlertSummary["severity"] | null;
  silencedUntil?: string | null;
  metadata?: Json | null;
}) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const actorUserId = await currentUserId();
  const now = new Date().toISOString();
  const { data: beforeData } = await supabase
    .from("alert_acknowledgements")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("alert_id", input.alertId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("alert_acknowledgements")
    .upsert(
      {
        tenant_id: input.tenantId,
        alert_id: input.alertId,
        patient_id: input.patientId ?? null,
        status: input.status,
        note: input.note ?? null,
        source_type: input.sourceType ?? null,
        source_id: input.sourceId ?? null,
        priority: input.priority ?? null,
        acknowledged_by: actorUserId,
        acknowledged_at: now,
        resolved_by: input.status === "resolved" ? actorUserId : null,
        resolved_at: input.status === "resolved" ? now : null,
        attended_by: input.status === "attended" ? actorUserId : null,
        attended_at: input.status === "attended" ? now : null,
        silenced_until: input.status === "silenced" ? input.silencedUntil ?? null : null,
        metadata: input.metadata ?? {},
        updated_at: now,
      },
      { onConflict: "tenant_id,alert_id" },
    )
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo actualizar la alerta.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: `alert.${input.status}`,
    entityType: "alert_acknowledgements",
    entityId: String(data.id),
    beforeData: beforeData ?? null,
    afterData: {
      alert_id: input.alertId,
      status: input.status,
      patient_id: input.patientId ?? null,
      source_type: input.sourceType ?? null,
      source_id: input.sourceId ?? null,
    },
  });

  return data;
}

export async function acknowledgeAlertsBulk(input: {
  tenantId: string;
  alerts: Array<{
    alertId: string;
    patientId: string | null;
    sourceType?: AlertSummary["sourceType"] | null;
    sourceId?: string | null;
    priority?: AlertSummary["severity"] | null;
  }>;
  status: "reviewed" | "resolved";
}) {
  const actorUserId = await currentUserId();
  const results = [];
  for (const alert of input.alerts) {
    results.push(
      await acknowledgeAlert({
        tenantId: input.tenantId,
        alertId: alert.alertId,
        patientId: alert.patientId,
        sourceType: alert.sourceType ?? null,
        sourceId: alert.sourceId ?? null,
        priority: alert.priority ?? null,
        status: input.status,
      }),
    );
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: input.status === "reviewed" ? "alerts.bulk_reviewed" : "alerts.bulk_resolved",
    entityType: "alert_acknowledgements",
    entityId: null,
    afterData: { status: input.status, alert_count: input.alerts.length },
  });

  return results;
}

export async function getReportRunsForTenant(tenantId: string | null, options: ClinicalQueryOptions = {}): Promise<ClinicalSourceResult<ReportRunSummary[]>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: [] };
  }

  const { data, error } = await supabase
    .from("report_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw error ?? new Error("No se pudieron cargar los reportes.");
  }

  return {
    source: "supabase",
    data: data.map((row) => ({
      id: row.id,
      reportType: row.report_type,
      reportName: row.report_name,
      format: row.format,
      status: row.status,
      createdAt: row.created_at,
      payload: row.payload,
    })),
  };
}

export async function getClinicalAssessmentsForTenant(
  tenantId: string | null,
  options: ClinicalQueryOptions = {},
): Promise<ClinicalSourceResult<ClinicalAssessmentSummary[]>> {
  if (!(await canUseRemoteClinicalData(tenantId, options))) {
    return { source: "demo", data: [] };
  }

  const { data, error } = await supabase
    .from("clinical_assessments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw error ?? new Error("No se pudieron cargar las evaluaciones clínicas.");
  }

  return {
    source: "supabase",
    data: data.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      encounterId: row.encounter_id,
      status: row.status,
      diagnosisProblem: row.diagnosis_problem,
      conduct: row.conduct,
      createdAt: row.created_at,
    })),
  };
}

export async function createReportRun(input: {
  tenantId: string;
  reportType: string;
  reportName: string;
  format: string;
  filters: Json;
  payload: Json;
}) {
  if (!supabase) throw new Error("Supabase no est configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("report_runs")
    .insert({
      tenant_id: input.tenantId,
      report_type: input.reportType,
      report_name: input.reportName,
      format: input.format,
      status: "completed",
      filters: input.filters ?? {},
      payload: input.payload,
      created_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo generar el reporte.");

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "report.generate",
    entityType: "report_runs",
    entityId: data.id,
    afterData: { report_type: data.report_type, format: data.format, status: data.status },
  });

  return data;
}

export async function saveClinicalAssessment(input: {
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  sections: Json;
  diagnosisProblem: string | null;
  diagnosisEtiology: string | null;
  diagnosisSignsSymptoms: string | null;
  conduct: string | null;
  nextFollowUpAt: string | null;
  noteTitle: string;
  noteBody: string;
}) {
  if (!supabase) throw new Error("Supabase no est configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("clinical_assessments")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      sections: input.sections,
      diagnosis_problem: input.diagnosisProblem ?? null,
      diagnosis_etiology: input.diagnosisEtiology ?? null,
      diagnosis_signs_symptoms: input.diagnosisSignsSymptoms ?? null,
      conduct: input.conduct ?? null,
      status: "draft",
      created_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo guardar la evaluación.");

  if (input.noteTitle && input.noteBody) {
    const { error: noteError } = await supabase.from("clinical_notes").insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      note_type: "assessment",
      title: input.noteTitle,
      body: input.noteBody,
      created_by: actorUserId,
    });

    if (noteError) throw noteError;
  }

  const { error: patientUpdateError } = await supabase
    .from("patients")
    .update({
      last_evaluation_at: new Date().toISOString(),
      next_follow_up_at: input.nextFollowUpAt ?? null,
      updated_by: actorUserId,
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.patientId);

  if (patientUpdateError) {
    console.warn("No se pudo actualizar el resumen del paciente tras guardar la evaluación.", patientUpdateError.message);
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "clinical_assessment.create",
    entityType: "clinical_assessments",
    entityId: data.id,
    afterData: { status: data.status },
  });

  return data;
}

export async function saveScreeningResult(input: {
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  templateId: string;
  templateVersion: string;
  score: number;
  riskLevel: string;
  flags: string[];
  recommendation: string | null;
  nextReviewAt: string | null;
  answers: Array<{ itemId: string; answerValue: Json; score: number; flags: string[] }>;
}) {
  if (!supabase) throw new Error("Supabase no est configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("screening_results")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      template_id: input.templateId,
      template_version: input.templateVersion,
      score: input.score,
      risk_level: input.riskLevel,
      flags: input.flags,
      recommendation: input.recommendation ?? null,
      next_review_at: input.nextReviewAt ?? null,
      created_by: actorUserId,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo guardar screening.");

  if (input.answers.length > 0) {
    const { error: answersError } = await supabase.from("screening_answers").insert(
      input.answers.map((answer) => ({
        tenant_id: input.tenantId,
        screening_result_id: data.id,
        item_id: answer.itemId,
        answer_value: answer.answerValue,
        score: answer.score,
        flags: answer.flags,
      })),
    );

    if (answersError) throw answersError;
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "screening.create",
    entityType: "screening_results",
    entityId: data.id,
    afterData: { template_id: data.template_id, score: data.score, risk_level: data.risk_level },
  });

  return data;
}

export async function saveAnthropometrySession(input: {
  tenantId: string;
  patientId: string;
  encounterId: string | null;
  protocolId: string;
  qualityIndex: number;
  formulaVersionIds: string[];
  notes: string | null;
  measurements: Array<{
    siteId: string;
    attempt: number;
    value: number;
    unit: string;
    deltaFromPrevious: number | null;
    qualityFlag: string | null;
    notes: string | null;
  }>;
  derived: Array<{
    formulaVersionId: string;
    outputType: string;
    value: number | null;
    valueJson: Json | null;
    unit: string | null;
    interpretation: string | null;
  }>;
}) {
  if (!supabase) throw new Error("Supabase no est configurado.");
  const actorUserId = await currentUserId();
  const { data, error } = await supabase
    .from("anthropometry_sessions")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      encounter_id: input.encounterId ?? null,
      protocol_id: input.protocolId,
      evaluator_user_id: actorUserId,
      quality_index: input.qualityIndex,
      formula_version_ids: input.formulaVersionIds,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("No se pudo guardar la sesión antropométrica.");

  if (input.measurements.length > 0) {
    const { error: measurementsError } = await supabase.from("anthropometric_measurements").insert(
      input.measurements.map((measurement) => ({
        tenant_id: input.tenantId,
        session_id: data.id,
        site_id: measurement.siteId,
        attempt: measurement.attempt,
        value: measurement.value,
        unit: measurement.unit,
        delta_from_previous: measurement.deltaFromPrevious ?? null,
        quality_flag: measurement.qualityFlag ?? null,
        notes: measurement.notes ?? null,
      })),
    );

    if (measurementsError) throw measurementsError;
  }

  if (input.derived.length > 0) {
    const { error: derivedError } = await supabase.from("derived_anthropometry_results").insert(
      input.derived.map((result) => ({
        tenant_id: input.tenantId,
        session_id: data.id,
        formula_version_id: result.formulaVersionId,
        output_type: result.outputType,
        value: result.value ?? null,
        value_json: result.valueJson ?? null,
        unit: result.unit ?? null,
        interpretation: result.interpretation ?? null,
      })),
    );

    if (derivedError) throw derivedError;
  }

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId,
    eventType: "anthropometry.create",
    entityType: "anthropometry_sessions",
    entityId: data.id,
    afterData: { protocol_id: data.protocol_id, quality_index: data.quality_index },
  });

  return data;
}

export async function writeAuditLog(input: {
  tenantId: string;
  actorUserId: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  beforeData?: Json | null;
  afterData?: Json | null;
}) {
  if (!supabase) return;
  const { error } = await supabase.from("audit_logs").insert({
    tenant_id: input.tenantId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_data: input.beforeData ?? null,
    after_data: input.afterData ?? null,
  });
  if (error) {
    throw new Error(`No se pudo registrar auditoria (${input.eventType}): ${error.message}`);
  }
}
