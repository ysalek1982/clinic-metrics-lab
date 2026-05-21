import { MODULE_REGISTRY, type ModuleDefinition } from "@/config/moduleRegistry";

export type OperationalProfileId =
  | "hospital"
  | "clinical-consult"
  | "sports"
  | "pediatric"
  | "operational-nutrition"
  | "administration";

export type OperationalProfile = {
  id: OperationalProfileId;
  label: string;
  description: string;
  modules: string[];
  requiredPermissions: string[];
  defaultLandingRoute: string;
  blockedRequirements: string[];
  recommendedFor: string[];
};

export type OperationalProfileSignals = {
  enabledPacks?: string[];
  hasHospitalData?: boolean;
  hasSportsData?: boolean;
  hasPediatricData?: boolean;
  hasNutritionOperationsData?: boolean;
  isAdmin?: boolean;
};

export const OPERATIONAL_PROFILES: OperationalProfile[] = [
  {
    id: "hospital",
    label: "Hospital",
    description: "Soporte nutricional hospitalario con pacientes, labs, alertas, agenda, reportes y Copilot contextual.",
    modules: ["patients", "enteral", "parenteral", "labs", "alerts", "agenda", "reports-center", "copilot"],
    requiredPermissions: ["patients.read", "enteral.read", "parenteral.read", "labs.read", "alerts.read", "appointments.read", "reports.read", "ai.assist"],
    defaultLandingRoute: "/app/pack/enteral/cockpit",
    blockedRequirements: ["Persistencia de perfil tenant-scoped pendiente.", "QA Seguridad P0 pendiente con usuarios reales."],
    recommendedFor: ["Hospitales", "Unidades de soporte nutricional", "Equipos con enteral/parenteral y laboratorios"],
  },
  {
    id: "clinical-consult",
    label: "Consulta clinica",
    description: "Atencion ambulatoria con pacientes, antropometria, planes, agenda, recetas, menu semanal y reportes.",
    modules: ["patients", "anthropometry", "plans", "agenda", "recipes", "weekly-menu", "reports-center"],
    requiredPermissions: ["patients.read", "anthropometry.read", "nutrition_plans.approve", "appointments.read", "recipes.read", "weekly_menus.read", "reports.read"],
    defaultLandingRoute: "/app/patients",
    blockedRequirements: ["Persistencia de perfil tenant-scoped pendiente."],
    recommendedFor: ["Consultorios de nutricion", "Centros clinicos", "Seguimiento ambulatorio"],
  },
  {
    id: "sports",
    label: "Deportivo",
    description: "Flujo deportivo con somatocarta, perfil deportivo, antropometria, planes, reportes deportivos y Copilot.",
    modules: ["sports-profile", "somatocarta", "anthropometry", "plans", "sports-report", "copilot"],
    requiredPermissions: ["sports.read", "anthropometry.read", "nutrition_plans.approve", "reports.generate", "ai.assist"],
    defaultLandingRoute: "/app/somatocarta",
    blockedRequirements: ["Somatotipo solo se calcula con datos suficientes.", "Persistencia de perfil tenant-scoped pendiente."],
    recommendedFor: ["Clubes deportivos", "Alto rendimiento", "Evaluacion antropometrica deportiva"],
  },
  {
    id: "pediatric",
    label: "Pediatria",
    description: "Seguimiento pediatrico con curvas, pacientes, antropometria, planes, labs y agenda.",
    modules: ["pediatric-curves", "patients", "anthropometry", "plans", "labs", "agenda"],
    requiredPermissions: ["pediatrics.read", "patients.read", "anthropometry.read", "nutrition_plans.approve", "labs.read", "appointments.read"],
    defaultLandingRoute: "/app/pediatric-curves",
    blockedRequirements: ["CSV oficiales WHO/OMS pendientes para z-score/percentil completo.", "Persistencia de perfil tenant-scoped pendiente."],
    recommendedFor: ["Pediatria", "Crecimiento infantil", "Seguimiento nutricional infantil"],
  },
  {
    id: "operational-nutrition",
    label: "Nutricion operativa",
    description: "Biblioteca operativa con alimentos, recetas, menu semanal, reportes y configuracion.",
    modules: ["foods", "recipes", "weekly-menu", "nutrition-reports", "institution-settings"],
    requiredPermissions: ["foods.read", "recipes.read", "weekly_menus.read", "reports.read", "settings.manage"],
    defaultLandingRoute: "/app/foods",
    blockedRequirements: ["Persistencia de perfil tenant-scoped pendiente."],
    recommendedFor: ["Cocina clinica", "Planificacion de menus", "Operacion nutricional"],
  },
  {
    id: "administration",
    label: "Administracion",
    description: "Gestion administrativa con usuarios, organizacion, auditoria, reportes y centro de modulos.",
    modules: ["users-roles", "organization", "audit", "reports-center", "modules-center"],
    requiredPermissions: ["users.read", "organization.read", "audit_logs.read", "reports.read", "modules.read"],
    defaultLandingRoute: "/app/users",
    blockedRequirements: ["Edge Function admin-invite-user pendiente de deploy.", "Usuarios QA reales pendientes."],
    recommendedFor: ["Administradores de tenant", "Superadministracion", "Revision de seguridad y auditoria"],
  },
];

export function getOperationalProfile(id: OperationalProfileId | string | null | undefined) {
  return OPERATIONAL_PROFILES.find((profile) => profile.id === id) ?? null;
}

export function getProfileModules<T extends ModuleDefinition>(profile: OperationalProfile, modules: T[] = MODULE_REGISTRY as T[]) {
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  return profile.modules.map((moduleId) => moduleById.get(moduleId)).filter(Boolean) as T[];
}

export function getProfileModuleIds(profileId: OperationalProfileId | string | null | undefined) {
  return new Set(getOperationalProfile(profileId)?.modules ?? []);
}

export function suggestOperationalProfile(signals: OperationalProfileSignals = {}): OperationalProfile {
  const enabledPacks = new Set(signals.enabledPacks ?? []);

  if (signals.isAdmin) return getOperationalProfile("administration") as OperationalProfile;
  if (signals.hasHospitalData || enabledPacks.has("enteral") || enabledPacks.has("parenteral")) return getOperationalProfile("hospital") as OperationalProfile;
  if (signals.hasSportsData || enabledPacks.has("sport")) return getOperationalProfile("sports") as OperationalProfile;
  if (signals.hasPediatricData || enabledPacks.has("pediatric") || enabledPacks.has("neonatal")) return getOperationalProfile("pediatric") as OperationalProfile;
  if (signals.hasNutritionOperationsData) return getOperationalProfile("operational-nutrition") as OperationalProfile;

  return getOperationalProfile("clinical-consult") as OperationalProfile;
}
