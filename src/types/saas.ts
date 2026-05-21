import type { PackId, RiskLevel } from "@/types/domain";

export type TenantPlanId =
  | "starter"
  | "professional"
  | "enterprise"
  | "hospital_enterprise"
  | "sports_performance"
  | "custom";

export type TenantStatus = "trial" | "active" | "past_due" | "suspended";

export type InstitutionType =
  | "general_hospital"
  | "pediatric_hospital"
  | "sports_center"
  | "private_clinic"
  | "maternal_unit"
  | "enterprise_health";

export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "export"
  | "manage";

export type PermissionScope =
  | "platform"
  | "tenant"
  | "organization"
  | "branch"
  | "department"
  | "service"
  | "patient"
  | "specialty_pack";

export type ClinicalModuleId =
  | "clinical_caseboard"
  | "pediatric_curves"
  | "gineco_follow_up"
  | "enteral_cockpit"
  | "sport_somatocarta"
  | "ccorp_level1";

export interface SubscriptionPlan {
  id: TenantPlanId;
  name: string;
  marketPosition: string;
  monthlyPriceUsd: number | null;
  includedUsers: number | null;
  activePatientLimit: number | null;
  branchLimit: number | null;
  enabledPackLimit: number | null;
  aiEnabled: boolean;
  whiteLabelEnabled: boolean;
  features: string[];
}

export interface SpecialtyPackCatalogItem {
  id: PackId;
  name: string;
  category: string;
  description: string;
  systemEnabled: boolean;
  defaultModules: ClinicalModuleId[];
}

export interface ClinicalModuleDefinition {
  id: ClinicalModuleId;
  packId: PackId;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  routeKey: string;
  defaultEnabled: boolean;
  sortOrder: number;
  systemEnabled: boolean;
}

export interface TenantEnabledModule {
  tenantId: string;
  moduleId: ClinicalModuleId;
  packId: PackId;
  slug: string;
  enabled: boolean;
  enabledAt: string;
  config: Record<string, unknown>;
}

export interface TenantUsageLimits {
  users: number | null;
  branches: number | null;
  activePatients: number | null;
  enabledPacks: number | null;
  monthlyReports: number | null;
  aiEvents: number | null;
  storageGb: number | null;
}

export interface TenantUsageSnapshot {
  users: number;
  branches: number;
  activePatients: number;
  enabledPacks: number;
  monthlyReports: number;
  aiEvents: number;
  storageGb: number;
}

export interface TenantBranding {
  logoInitials: string;
  primaryColor: string;
  accentColor: string;
  commercialName: string;
}

export interface TenantSettings {
  language: "es" | "en" | "pt";
  timezone: string;
  unitSystem: "metric" | "imperial";
  defaultFollowUpDays: number;
  strictFormulaVersioning: boolean;
  aiAssistEnabled: boolean;
  requirePlanApproval: boolean;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  planId: TenantPlanId;
  trialEndsAt: string;
  renewalDate: string;
  institutionType: InstitutionType;
  region: string;
  branding: TenantBranding;
  settings: TenantSettings;
  limits: TenantUsageLimits;
  usage: TenantUsageSnapshot;
  enabledPacks: PackId[];
  enabledModules: TenantEnabledModule[];
}

export interface OrganizationUnit {
  id: string;
  tenantId: string;
  name: string;
  type: InstitutionType;
  branches: Branch[];
  departments: Department[];
  services: Service[];
}

export interface Branch {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  city: string;
  timezone: string;
  status: "active" | "inactive";
}

export interface Department {
  id: string;
  tenantId: string;
  organizationId: string;
  branchId: string;
  name: string;
  clinicalArea: string;
}

export interface Service {
  id: string;
  tenantId: string;
  departmentId: string;
  name: string;
  defaultPack: PackId;
  careSetting: "inpatient" | "outpatient" | "sports" | "telehealth" | "mixed";
}

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  scope: PermissionScope;
  description: string;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  level: "platform" | "tenant" | "clinical" | "operational" | "external";
  permissions: string[];
  baseRole: boolean;
}

export interface TeamMember {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  initials: string;
  title: string;
  roleIds: string[];
  branchIds: string[];
  serviceIds: string[];
  status: "active" | "invited" | "inactive";
  lastActiveAt: string;
}

export interface SaasPatientSnapshot {
  id: string;
  tenantId: string;
  organizationId: string;
  branchId: string;
  serviceId: string;
  mrn: string;
  fullName: string;
  birthDate: string | null;
  ageLabel: string;
  sex: "female" | "male" | "other";
  primaryPack: PackId;
  activePacks: PackId[];
  risk: RiskLevel;
  status: "active" | "monitoring" | "critical" | "discharged";
  diagnosisSummary: string;
  location: string;
  lastEvaluationAt: string;
  nextFollowUpAt: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface EncounterSnapshot {
  id: string;
  tenantId: string;
  patientId: string;
  type: "admission" | "outpatient" | "sports_season" | "teleconsult" | "follow_up";
  title: string;
  status: "open" | "closed" | "on_hold";
  openedAt: string;
  ownerId: string;
  notes?: string | null;
}

export interface PlatformTenantSummary {
  tenantId: string;
  name: string;
  status: TenantStatus;
  planId: TenantPlanId;
  users: number;
  activePatients: number;
  enabledPacks: number;
  monthlyReports: number;
  lastActivityAt: string;
}
