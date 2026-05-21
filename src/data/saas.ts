import type {
  Branch,
  ClinicalModuleDefinition,
  ClinicalModuleId,
  Department,
  EncounterSnapshot,
  OrganizationUnit,
  Permission,
  PlatformTenantSummary,
  Role,
  SaasPatientSnapshot,
  Service,
  SubscriptionPlan,
  TeamMember,
  Tenant,
  TenantEnabledModule,
} from "@/types/saas";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    marketPosition: "Consulta privada y equipos pequenos",
    monthlyPriceUsd: 89,
    includedUsers: 3,
    activePatientLimit: 250,
    branchLimit: 1,
    enabledPackLimit: 3,
    aiEnabled: false,
    whiteLabelEnabled: false,
    features: ["Pacientes", "Episodios", "Planes basicos", "Reportes PDF"],
  },
  {
    id: "professional",
    name: "Professional",
    marketPosition: "Clinicas y centros con multiples profesionales",
    monthlyPriceUsd: 249,
    includedUsers: 12,
    activePatientLimit: 1500,
    branchLimit: 3,
    enabledPackLimit: 8,
    aiEnabled: true,
    whiteLabelEnabled: false,
    features: ["Packs configurables", "Antropometria avanzada", "Screening", "IA asistida"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    marketPosition: "Instituciones regionales y redes clinicas",
    monthlyPriceUsd: 799,
    includedUsers: 60,
    activePatientLimit: 10000,
    branchLimit: 12,
    enabledPackLimit: null,
    aiEnabled: true,
    whiteLabelEnabled: true,
    features: ["Multi-sede", "Roles granulares", "Auditoria avanzada", "Dashboards ejecutivos"],
  },
  {
    id: "hospital_enterprise",
    name: "Hospital Enterprise",
    marketPosition: "Hospitales de alta complejidad",
    monthlyPriceUsd: null,
    includedUsers: null,
    activePatientLimit: null,
    branchLimit: null,
    enabledPackLimit: null,
    aiEnabled: true,
    whiteLabelEnabled: true,
    features: ["UCI", "Enteral", "Parenteral", "Integraciones HIS", "SLA enterprise"],
  },
  {
    id: "sports_performance",
    name: "Sports Performance",
    marketPosition: "Alto rendimiento, clubes y federaciones",
    monthlyPriceUsd: 399,
    includedUsers: 20,
    activePatientLimit: 1200,
    branchLimit: 4,
    enabledPackLimit: 5,
    aiEnabled: true,
    whiteLabelEnabled: true,
    features: ["Atletas", "Somatotipo", "Ciclos de entrenamiento", "Reportes staff"],
  },
  {
    id: "custom",
    name: "Custom",
    marketPosition: "Implementaciones a medida",
    monthlyPriceUsd: null,
    includedUsers: null,
    activePatientLimit: null,
    branchLimit: null,
    enabledPackLimit: null,
    aiEnabled: true,
    whiteLabelEnabled: true,
    features: ["White-label", "Integraciones", "Soporte dedicado", "Data residency"],
  },
];

export const PERMISSIONS: Permission[] = [
  { id: "platform.tenants.manage", resource: "platform.tenants", action: "manage", scope: "platform", description: "Administrar tenants de la plataforma" },
  { id: "billing.manage", resource: "billing", action: "manage", scope: "tenant", description: "Gestionar suscripcion y limites" },
  { id: "settings.manage", resource: "tenant.settings", action: "manage", scope: "tenant", description: "Configurar branding, packs y protocolos" },
  { id: "users.manage", resource: "users", action: "manage", scope: "tenant", description: "Invitar usuarios y administrar roles" },
  { id: "patients.read", resource: "patients", action: "read", scope: "service", description: "Ver pacientes segun alcance asignado" },
  { id: "patients.create", resource: "patients", action: "create", scope: "service", description: "Crear pacientes" },
  { id: "patients.update", resource: "patients", action: "update", scope: "service", description: "Editar ficha de paciente" },
  { id: "encounters.manage", resource: "encounters", action: "manage", scope: "service", description: "Crear y cerrar episodios o casos" },
  { id: "anthropometry.create", resource: "anthropometry", action: "create", scope: "specialty_pack", description: "Registrar mediciones antropometricas" },
  { id: "anthropometry.validate", resource: "anthropometry", action: "approve", scope: "specialty_pack", description: "Validar calidad intra/interevaluador" },
  { id: "ccorp_level1.read", resource: "ccorp_level1", action: "read", scope: "specialty_pack", description: "Ver evaluaciones de composicion corporal Nivel 1" },
  { id: "ccorp_level1.create", resource: "ccorp_level1", action: "create", scope: "specialty_pack", description: "Crear evaluaciones de composicion corporal Nivel 1" },
  { id: "ccorp_level1.update", resource: "ccorp_level1", action: "update", scope: "specialty_pack", description: "Editar evaluaciones de composicion corporal Nivel 1" },
  { id: "ccorp_level1.delete", resource: "ccorp_level1", action: "delete", scope: "specialty_pack", description: "Eliminar logicamente evaluaciones de composicion corporal Nivel 1" },
  { id: "ccorp_level1.print", resource: "ccorp_level1", action: "export", scope: "specialty_pack", description: "Imprimir informes CCORP Nivel 1" },
  { id: "ccorp_level1.export", resource: "ccorp_level1", action: "export", scope: "specialty_pack", description: "Exportar informes CCORP Nivel 1" },
  { id: "screening.create", resource: "screening", action: "create", scope: "specialty_pack", description: "Ejecutar screenings nutricionales" },
  { id: "nutrition_plans.approve", resource: "nutrition_plans", action: "approve", scope: "service", description: "Aprobar planes nutricionales" },
  { id: "reports.export", resource: "reports", action: "export", scope: "tenant", description: "Exportar PDF/Excel con branding" },
  { id: "audit.read", resource: "audit_logs", action: "read", scope: "tenant", description: "Consultar auditoria institucional" },
  { id: "ai.assist", resource: "ai_assist", action: "create", scope: "tenant", description: "Usar asistente IA con guardrails" },
];

export const ROLES: Role[] = [
  {
    id: "platform_superadmin",
    name: "Superadmin plataforma",
    description: "Operacion SaaS, tenants, planes y soporte.",
    level: "platform",
    baseRole: true,
    permissions: ["platform.tenants.manage", "audit.read"],
  },
  {
    id: "tenant_owner",
    name: "Owner del tenant",
    description: "Control total sobre configuracion, usuarios y suscripcion.",
    level: "tenant",
    baseRole: true,
    permissions: ["billing.manage", "settings.manage", "users.manage", "patients.read", "reports.export", "audit.read", "ai.assist", "ccorp_level1.read", "ccorp_level1.create", "ccorp_level1.update", "ccorp_level1.delete", "ccorp_level1.print", "ccorp_level1.export"],
  },
  {
    id: "nutrition_director",
    name: "Director de nutricion",
    description: "Gobierno clinico, protocolos, reportes y aprobaciones.",
    level: "clinical",
    baseRole: true,
    permissions: ["patients.read", "patients.update", "encounters.manage", "anthropometry.validate", "screening.create", "nutrition_plans.approve", "reports.export", "audit.read", "ai.assist", "ccorp_level1.read", "ccorp_level1.create", "ccorp_level1.update", "ccorp_level1.print", "ccorp_level1.export"],
  },
  {
    id: "clinical_nutritionist",
    name: "Nutricionista clinico",
    description: "Atencion clinica, planes y evolucion.",
    level: "clinical",
    baseRole: true,
    permissions: ["patients.read", "patients.create", "patients.update", "encounters.manage", "screening.create", "nutrition_plans.approve", "ai.assist", "ccorp_level1.read", "ccorp_level1.create", "ccorp_level1.update"],
  },
  {
    id: "anthropometrist",
    name: "Antropometrista",
    description: "Medicion avanzada y control de calidad.",
    level: "clinical",
    baseRole: true,
    permissions: ["patients.read", "anthropometry.create", "anthropometry.validate", "reports.export", "ccorp_level1.read", "ccorp_level1.create", "ccorp_level1.update", "ccorp_level1.print", "ccorp_level1.export"],
  },
  {
    id: "sports_nutritionist",
    name: "Nutricionista deportivo",
    description: "Atletas, composición corporal y ciclos de entrenamiento.",
    level: "clinical",
    baseRole: true,
    permissions: ["patients.read", "patients.create", "patients.update", "anthropometry.create", "nutrition_plans.approve", "reports.export", "ai.assist", "ccorp_level1.read", "ccorp_level1.create", "ccorp_level1.update", "ccorp_level1.print", "ccorp_level1.export"],
  },
  {
    id: "auditor",
    name: "Auditor",
    description: "Lectura de datos y trazabilidad sin modificar registros.",
    level: "operational",
    baseRole: true,
    permissions: ["patients.read", "reports.export", "audit.read", "ccorp_level1.read", "ccorp_level1.print"],
  },
];

export const CLINICAL_MODULES: ClinicalModuleDefinition[] = [
  {
    id: "clinical_caseboard",
    packId: "clinical",
    slug: "caseboard",
    name: "Caseboard clinico",
    shortName: "Caseboard",
    description: "Carga operativa, riesgo, seguimientos y casos abiertos del pack clinico.",
    routeKey: "clinical/caseboard",
    defaultEnabled: true,
    sortOrder: 10,
    systemEnabled: true,
  },
  {
    id: "pediatric_curves",
    packId: "pediatric",
    slug: "curves",
    name: "Curvas pediatricas",
    shortName: "Curvas",
    description: "Peso/edad, talla/edad, IMC/edad y trayectoria longitudinal.",
    routeKey: "pediatric/curves",
    defaultEnabled: true,
    sortOrder: 20,
    systemEnabled: true,
  },
  {
    id: "gineco_follow_up",
    packId: "gineco",
    slug: "follow-up",
    name: "Seguimiento gineco",
    shortName: "Seguimiento",
    description: "Control por trimestre, ganancia gestacional y micronutrientes.",
    routeKey: "gineco/follow-up",
    defaultEnabled: true,
    sortOrder: 30,
    systemEnabled: true,
  },
  {
    id: "enteral_cockpit",
    packId: "enteral",
    slug: "cockpit",
    name: "Cockpit enteral",
    shortName: "Cockpit",
    description: "Acceso, formula, volumen, velocidad, tolerancia y checklist diario.",
    routeKey: "enteral/cockpit",
    defaultEnabled: true,
    sortOrder: 40,
    systemEnabled: true,
  },
  {
    id: "sport_somatocarta",
    packId: "sport",
    slug: "somatocarta",
    name: "Somatocarta",
    shortName: "Somatocarta",
    description: "Somatotipo, composición corporal y tendencia deportiva.",
    routeKey: "sport/somatocarta",
    defaultEnabled: true,
    sortOrder: 50,
    systemEnabled: true,
  },
  {
    id: "ccorp_level1",
    packId: "sport",
    slug: "ccorp-level-1",
    name: "Composición Corporal Nivel 1",
    shortName: "CCORP Nivel 1",
    description: "Hoja de trabajo, composición corporal, somatotipo y peso ideal.",
    routeKey: "sport/ccorp-level-1",
    defaultEnabled: true,
    sortOrder: 55,
    systemEnabled: true,
  },
];

function buildTenantModules(tenantId: string, moduleIds: ClinicalModuleId[]): TenantEnabledModule[] {
  return CLINICAL_MODULES
    .filter((module) => moduleIds.includes(module.id))
    .map((module) => ({
      tenantId,
      moduleId: module.id,
      packId: module.packId,
      slug: module.slug,
      enabled: true,
      enabledAt: "2026-04-23T09:00:00",
      config: {},
    }));
}

export const TENANTS: Tenant[] = [
  {
    id: "tenant-san-mateo",
    slug: "san-mateo",
    name: "Hospital Universitario San Mateo",
    status: "active",
    planId: "hospital_enterprise",
    renewalDate: "2026-12-31",
    institutionType: "general_hospital",
    region: "LatAm",
    branding: { logoInitials: "HSM", primaryColor: "#13c8df", accentColor: "#a6e13a", commercialName: "San Mateo Nutrition Command" },
    settings: { language: "es", timezone: "America/Bogota", unitSystem: "metric", defaultFollowUpDays: 7, strictFormulaVersioning: true, aiAssistEnabled: true, requirePlanApproval: true },
    limits: { users: null, branches: null, activePatients: null, enabledPacks: null, monthlyReports: null, aiEvents: null, storageGb: null },
    usage: { users: 48, branches: 3, activePatients: 336, enabledPacks: 10, monthlyReports: 184, aiEvents: 622, storageGb: 34 },
    enabledPacks: ["clinical", "pediatric", "neonatal", "gineco", "enteral", "parenteral", "sport", "onco", "geriatric", "endocrine"],
    enabledModules: buildTenantModules("tenant-san-mateo", [
      "clinical_caseboard",
      "pediatric_curves",
      "gineco_follow_up",
      "enteral_cockpit",
      "sport_somatocarta",
      "ccorp_level1",
    ]),
  },
  {
    id: "tenant-infantia",
    slug: "infantia",
    name: "Instituto Pediatrico Infantia",
    status: "trial",
    planId: "enterprise",
    trialEndsAt: "2026-05-18",
    institutionType: "pediatric_hospital",
    region: "LatAm",
    branding: { logoInitials: "IP", primaryColor: "#f4a62a", accentColor: "#13c8df", commercialName: "Infantia Growth Lab" },
    settings: { language: "es", timezone: "America/La_Paz", unitSystem: "metric", defaultFollowUpDays: 14, strictFormulaVersioning: true, aiAssistEnabled: true, requirePlanApproval: true },
    limits: { users: 60, branches: 5, activePatients: 10000, enabledPacks: null, monthlyReports: null, aiEvents: 2500, storageGb: 100 },
    usage: { users: 19, branches: 2, activePatients: 1184, enabledPacks: 4, monthlyReports: 76, aiEvents: 198, storageGb: 12 },
    enabledPacks: ["pediatric", "neonatal", "clinical", "enteral"],
    enabledModules: buildTenantModules("tenant-infantia", [
      "clinical_caseboard",
      "pediatric_curves",
      "enteral_cockpit",
    ]),
  },
  {
    id: "tenant-madre-futura",
    slug: "madre-futura",
    name: "Unidad Materno Fetal Madre Futura",
    status: "active",
    planId: "professional",
    renewalDate: "2026-09-30",
    institutionType: "maternal_unit",
    region: "LatAm",
    branding: { logoInitials: "MF", primaryColor: "#ef6aa2", accentColor: "#27d7b0", commercialName: "Madre Futura Nutricion" },
    settings: { language: "es", timezone: "America/La_Paz", unitSystem: "metric", defaultFollowUpDays: 21, strictFormulaVersioning: true, aiAssistEnabled: true, requirePlanApproval: false },
    limits: { users: 12, branches: 3, activePatients: 1500, enabledPacks: 8, monthlyReports: 250, aiEvents: 1000, storageGb: 40 },
    usage: { users: 8, branches: 1, activePatients: 426, enabledPacks: 3, monthlyReports: 38, aiEvents: 92, storageGb: 5 },
    enabledPacks: ["gineco", "clinical", "pediatric"],
    enabledModules: buildTenantModules("tenant-madre-futura", [
      "clinical_caseboard",
      "gineco_follow_up",
      "pediatric_curves",
    ]),
  },
  {
    id: "tenant-elite-performance",
    slug: "elite-performance",
    name: "Centro Elite Performance",
    status: "active",
    planId: "sports_performance",
    renewalDate: "2027-01-15",
    institutionType: "sports_center",
    region: "Global",
    branding: { logoInitials: "EP", primaryColor: "#a6e13a", accentColor: "#13c8df", commercialName: "Elite Performance Nutrition" },
    settings: { language: "es", timezone: "America/La_Paz", unitSystem: "metric", defaultFollowUpDays: 14, strictFormulaVersioning: true, aiAssistEnabled: true, requirePlanApproval: false },
    limits: { users: 20, branches: 4, activePatients: 1200, enabledPacks: 5, monthlyReports: 400, aiEvents: 1500, storageGb: 60 },
    usage: { users: 16, branches: 1, activePatients: 212, enabledPacks: 3, monthlyReports: 121, aiEvents: 301, storageGb: 9 },
    enabledPacks: ["sport", "wellness", "clinical"],
    enabledModules: buildTenantModules("tenant-elite-performance", [
      "clinical_caseboard",
      "sport_somatocarta",
      "ccorp_level1",
    ]),
  },
  {
    id: "tenant-nutriclinic",
    slug: "nutriclinic",
    name: "NutriClinic Privada",
    status: "past_due",
    planId: "starter",
    institutionType: "private_clinic",
    region: "LatAm",
    branding: { logoInitials: "NC", primaryColor: "#13c8df", accentColor: "#f4a62a", commercialName: "NutriClinic OS" },
    settings: { language: "es", timezone: "America/La_Paz", unitSystem: "metric", defaultFollowUpDays: 30, strictFormulaVersioning: false, aiAssistEnabled: false, requirePlanApproval: false },
    limits: { users: 3, branches: 1, activePatients: 250, enabledPacks: 3, monthlyReports: 60, aiEvents: 0, storageGb: 10 },
    usage: { users: 3, branches: 1, activePatients: 248, enabledPacks: 3, monthlyReports: 57, aiEvents: 0, storageGb: 7 },
    enabledPacks: ["clinical", "endocrine", "wellness"],
    enabledModules: buildTenantModules("tenant-nutriclinic", ["clinical_caseboard"]),
  },
];

const sanMateoBranches: Branch[] = [
  { id: "branch-hsm-central", tenantId: "tenant-san-mateo", organizationId: "org-hsm", name: "Sede Central", city: "Bogota", timezone: "America/Bogota", status: "active" },
  { id: "branch-hsm-materno", tenantId: "tenant-san-mateo", organizationId: "org-hsm", name: "Torre Materno-Infantil", city: "Bogota", timezone: "America/Bogota", status: "active" },
  { id: "branch-hsm-car", tenantId: "tenant-san-mateo", organizationId: "org-hsm", name: "Centro Alto Rendimiento", city: "Bogota", timezone: "America/Bogota", status: "active" },
];

const sanMateoDepartments: Department[] = [
  { id: "dept-hsm-uci", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-central", name: "UCI y paciente critico", clinicalArea: "Hospitalizacion" },
  { id: "dept-hsm-pediatria", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-materno", name: "Pediatria y neonatos", clinicalArea: "Materno infantil" },
  { id: "dept-hsm-performance", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-car", name: "Performance lab", clinicalArea: "Deportivo" },
  { id: "dept-hsm-onco", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-central", name: "Oncologia y soporte", clinicalArea: "Alta complejidad" },
];

const sanMateoServices: Service[] = [
  { id: "svc-hsm-uci-nut", tenantId: "tenant-san-mateo", departmentId: "dept-hsm-uci", name: "Nutricion clinica UCI", defaultPack: "enteral", careSetting: "inpatient" },
  { id: "svc-hsm-ped-growth", tenantId: "tenant-san-mateo", departmentId: "dept-hsm-pediatria", name: "Crecimiento pediatrico", defaultPack: "pediatric", careSetting: "outpatient" },
  { id: "svc-hsm-ob", tenantId: "tenant-san-mateo", departmentId: "dept-hsm-pediatria", name: "Gineco-obstetricia", defaultPack: "gineco", careSetting: "outpatient" },
  { id: "svc-hsm-sport", tenantId: "tenant-san-mateo", departmentId: "dept-hsm-performance", name: "Alto rendimiento", defaultPack: "sport", careSetting: "sports" },
  { id: "svc-hsm-onco-nut", tenantId: "tenant-san-mateo", departmentId: "dept-hsm-onco", name: "Oncologia nutricional", defaultPack: "onco", careSetting: "mixed" },
];

export const ORGANIZATIONS: OrganizationUnit[] = [
  {
    id: "org-hsm",
    tenantId: "tenant-san-mateo",
    name: "Hospital Universitario San Mateo",
    type: "general_hospital",
    branches: sanMateoBranches,
    departments: sanMateoDepartments,
    services: sanMateoServices,
  },
  {
    id: "org-infantia",
    tenantId: "tenant-infantia",
    name: "Instituto Pediatrico Infantia",
    type: "pediatric_hospital",
    branches: [{ id: "branch-infantia-central", tenantId: "tenant-infantia", organizationId: "org-infantia", name: "Campus Infantil", city: "La Paz", timezone: "America/La_Paz", status: "active" }],
    departments: [{ id: "dept-infantia-growth", tenantId: "tenant-infantia", organizationId: "org-infantia", branchId: "branch-infantia-central", name: "Crecimiento y desarrollo", clinicalArea: "Pediatria" }],
    services: [{ id: "svc-infantia-growth", tenantId: "tenant-infantia", departmentId: "dept-infantia-growth", name: "Growth clinic", defaultPack: "pediatric", careSetting: "outpatient" }],
  },
  {
    id: "org-madre-futura",
    tenantId: "tenant-madre-futura",
    name: "Unidad Materno Fetal Madre Futura",
    type: "maternal_unit",
    branches: [{ id: "branch-mf-central", tenantId: "tenant-madre-futura", organizationId: "org-madre-futura", name: "Unidad Central", city: "Santa Cruz", timezone: "America/La_Paz", status: "active" }],
    departments: [{ id: "dept-mf-ob", tenantId: "tenant-madre-futura", organizationId: "org-madre-futura", branchId: "branch-mf-central", name: "Obstetricia nutricional", clinicalArea: "Gineco-obstetricia" }],
    services: [{ id: "svc-mf-ob", tenantId: "tenant-madre-futura", departmentId: "dept-mf-ob", name: "Seguimiento materno", defaultPack: "gineco", careSetting: "outpatient" }],
  },
  {
    id: "org-elite-performance",
    tenantId: "tenant-elite-performance",
    name: "Centro Elite Performance",
    type: "sports_center",
    branches: [{ id: "branch-ep-lab", tenantId: "tenant-elite-performance", organizationId: "org-elite-performance", name: "Performance Lab", city: "La Paz", timezone: "America/La_Paz", status: "active" }],
    departments: [{ id: "dept-ep-sport", tenantId: "tenant-elite-performance", organizationId: "org-elite-performance", branchId: "branch-ep-lab", name: "Staff tecnico", clinicalArea: "Performance" }],
    services: [{ id: "svc-ep-sport", tenantId: "tenant-elite-performance", departmentId: "dept-ep-sport", name: "Nutricion deportiva", defaultPack: "sport", careSetting: "sports" }],
  },
  {
    id: "org-nutriclinic",
    tenantId: "tenant-nutriclinic",
    name: "NutriClinic Privada",
    type: "private_clinic",
    branches: [{ id: "branch-nc-main", tenantId: "tenant-nutriclinic", organizationId: "org-nutriclinic", name: "Consultorio principal", city: "La Paz", timezone: "America/La_Paz", status: "active" }],
    departments: [{ id: "dept-nc-consulta", tenantId: "tenant-nutriclinic", organizationId: "org-nutriclinic", branchId: "branch-nc-main", name: "Consulta privada", clinicalArea: "Ambulatorio" }],
    services: [{ id: "svc-nc-consulta", tenantId: "tenant-nutriclinic", departmentId: "dept-nc-consulta", name: "Consulta nutricional", defaultPack: "clinical", careSetting: "outpatient" }],
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "usr-camila", tenantId: "tenant-san-mateo", name: "Dra. Camila Restrepo", email: "c.restrepo@sanmateo.health", initials: "CR", title: "Directora de nutricion", roleIds: ["tenant_owner", "nutrition_director"], branchIds: ["branch-hsm-central", "branch-hsm-materno"], serviceIds: ["svc-hsm-uci-nut", "svc-hsm-ped-growth"], status: "active", lastActiveAt: "2026-04-23T09:42:00" },
  { id: "usr-jpulido", tenantId: "tenant-san-mateo", name: "Javier Pulido", email: "j.pulido@sanmateo.health", initials: "JP", title: "Antropometrista ISAK III", roleIds: ["anthropometrist"], branchIds: ["branch-hsm-car"], serviceIds: ["svc-hsm-sport"], status: "active", lastActiveAt: "2026-04-23T08:11:00" },
  { id: "usr-lpardo", tenantId: "tenant-san-mateo", name: "Dra. Laura Pardo", email: "l.pardo@sanmateo.health", initials: "LP", title: "Nutricionista clinica UCI", roleIds: ["clinical_nutritionist"], branchIds: ["branch-hsm-central"], serviceIds: ["svc-hsm-uci-nut", "svc-hsm-onco-nut"], status: "active", lastActiveAt: "2026-04-22T18:20:00" },
  { id: "usr-mvargas", tenantId: "tenant-san-mateo", name: "Mariana Vargas", email: "m.vargas@sanmateo.health", initials: "MV", title: "Auditora clinica", roleIds: ["auditor"], branchIds: ["branch-hsm-central"], serviceIds: ["svc-hsm-uci-nut"], status: "invited", lastActiveAt: "2026-04-20T10:00:00" },
  { id: "usr-alzate", tenantId: "tenant-elite-performance", name: "Nicolas Alzate", email: "n.alzate@eliteperformance.com", initials: "NA", title: "Director performance nutrition", roleIds: ["tenant_owner", "sports_nutritionist"], branchIds: ["branch-ep-lab"], serviceIds: ["svc-ep-sport"], status: "active", lastActiveAt: "2026-04-23T07:58:00" },
];

export const SAAS_PATIENTS: SaasPatientSnapshot[] = [
  { id: "pt-hsm-001", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-central", serviceId: "svc-hsm-uci-nut", mrn: "HSM-48291", fullName: "Andres Mejia Vargas", ageLabel: "69 a", sex: "male", primaryPack: "enteral", activePacks: ["clinical", "enteral", "geriatric"], risk: "critical", status: "critical", diagnosisSummary: "EPOC reagudizado, desnutricion severa, disfagia", location: "UCI-2 / cama 204", lastEvaluationAt: "2026-04-22", nextFollowUpAt: "2026-04-24" },
  { id: "pt-hsm-002", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-materno", serviceId: "svc-hsm-ped-growth", mrn: "HSM-48292", fullName: "Sofia Caicedo Lopez", ageLabel: "7 a", sex: "female", primaryPack: "pediatric", activePacks: ["pediatric", "clinical"], risk: "moderate", status: "monitoring", diagnosisSummary: "Retraso pondoestatural leve, anemia ferropenica", location: "Consulta externa pediatrica", lastEvaluationAt: "2026-04-19", nextFollowUpAt: "2026-05-17" },
  { id: "pt-hsm-003", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-materno", serviceId: "svc-hsm-ob", mrn: "HSM-48293", fullName: "Mariana Quintero Rios", ageLabel: "31 a", sex: "female", primaryPack: "gineco", activePacks: ["gineco", "clinical"], risk: "low", status: "active", diagnosisSummary: "Embarazo 28 semanas, evolucion nutricional normal", location: "Materno-infantil", lastEvaluationAt: "2026-04-15", nextFollowUpAt: "2026-04-29" },
  { id: "pt-hsm-004", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-car", serviceId: "svc-hsm-sport", mrn: "CAR-00112", fullName: "Diego Alzate Pineda", ageLabel: "25 a", sex: "male", primaryPack: "sport", activePacks: ["sport", "wellness"], risk: "low", status: "active", diagnosisSummary: "Ciclista ruta elite, recomposición + rendimiento", location: "Performance Lab", lastEvaluationAt: "2026-04-18", nextFollowUpAt: "2026-05-02" },
  { id: "pt-hsm-005", tenantId: "tenant-san-mateo", organizationId: "org-hsm", branchId: "branch-hsm-central", serviceId: "svc-hsm-onco-nut", mrn: "HSM-48298", fullName: "Jeronimo Cardona Soto", ageLabel: "51 a", sex: "male", primaryPack: "onco", activePacks: ["clinical", "onco"], risk: "high", status: "monitoring", diagnosisSummary: "Cancer gastrico en QT, perdida de peso 8% en 30 dias", location: "Oncologia", lastEvaluationAt: "2026-04-20", nextFollowUpAt: "2026-04-25" },
  { id: "pt-infantia-001", tenantId: "tenant-infantia", organizationId: "org-infantia", branchId: "branch-infantia-central", serviceId: "svc-infantia-growth", mrn: "IP-0932", fullName: "Lucas Bermudez Ortiz", ageLabel: "16 m", sex: "male", primaryPack: "neonatal", activePacks: ["neonatal", "pediatric"], risk: "moderate", status: "monitoring", diagnosisSummary: "Prematuro tardio 35 semanas, bajo peso al nacer", location: "Neonatos seguimiento", lastEvaluationAt: "2026-04-22", nextFollowUpAt: "2026-04-23" },
  { id: "pt-mf-001", tenantId: "tenant-madre-futura", organizationId: "org-madre-futura", branchId: "branch-mf-central", serviceId: "svc-mf-ob", mrn: "MF-1204", fullName: "Valeria Rojas Molina", ageLabel: "29 a", sex: "female", primaryPack: "gineco", activePacks: ["gineco"], risk: "moderate", status: "active", diagnosisSummary: "Embarazo 32 semanas, anemia leve, ganancia ponderal baja", location: "Consulta obstetrica", lastEvaluationAt: "2026-04-21", nextFollowUpAt: "2026-05-05" },
  { id: "pt-ep-001", tenantId: "tenant-elite-performance", organizationId: "org-elite-performance", branchId: "branch-ep-lab", serviceId: "svc-ep-sport", mrn: "EP-777", fullName: "Isabela Tobon Marin", ageLabel: "23 a", sex: "female", primaryPack: "sport", activePacks: ["sport"], risk: "low", status: "active", diagnosisSummary: "Triatleta elite, fase precompetitiva, hidratacion avanzada", location: "Performance Lab", lastEvaluationAt: "2026-04-17", nextFollowUpAt: "2026-05-01" },
  { id: "pt-nc-001", tenantId: "tenant-nutriclinic", organizationId: "org-nutriclinic", branchId: "branch-nc-main", serviceId: "svc-nc-consulta", mrn: "NC-248", fullName: "Tomas Zuluaga Velez", ageLabel: "11 a", sex: "male", primaryPack: "endocrine", activePacks: ["clinical", "endocrine"], risk: "moderate", status: "monitoring", diagnosisSummary: "Obesidad infantil, resistencia a insulina", location: "Consulta privada", lastEvaluationAt: "2026-04-16", nextFollowUpAt: "2026-05-14" },
];

export const ENCOUNTERS: EncounterSnapshot[] = [
  { id: "enc-hsm-001", tenantId: "tenant-san-mateo", patientId: "pt-hsm-001", type: "admission", title: "Soporte nutricional enteral UCI", status: "open", openedAt: "2026-04-08", ownerId: "usr-lpardo" },
  { id: "enc-hsm-002", tenantId: "tenant-san-mateo", patientId: "pt-hsm-004", type: "sports_season", title: "Mesociclo competencia ruta", status: "open", openedAt: "2026-01-15", ownerId: "usr-jpulido" },
  { id: "enc-hsm-003", tenantId: "tenant-san-mateo", patientId: "pt-hsm-005", type: "follow_up", title: "Oncologia nutricional por perdida ponderal", status: "open", openedAt: "2026-04-20", ownerId: "usr-lpardo" },
  { id: "enc-ep-001", tenantId: "tenant-elite-performance", patientId: "pt-ep-001", type: "sports_season", title: "Bloque precompetitivo triatlon", status: "open", openedAt: "2026-03-01", ownerId: "usr-alzate" },
];

export const PLATFORM_SUMMARIES: PlatformTenantSummary[] = TENANTS.map((tenant) => ({
  tenantId: tenant.id,
  name: tenant.name,
  status: tenant.status,
  planId: tenant.planId,
  users: tenant.usage.users,
  activePatients: tenant.usage.activePatients,
  enabledPacks: tenant.usage.enabledPacks,
  monthlyReports: tenant.usage.monthlyReports,
  lastActivityAt: tenant.id === "tenant-nutriclinic" ? "2026-04-20T13:10:00" : "2026-04-23T09:42:00",
}));

export function getTenantByKey(key: string) {
  return TENANTS.find((tenant) => tenant.id === key || tenant.slug === key) ?? TENANTS[0];
}

export function getPlanById(id: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id) ?? SUBSCRIPTION_PLANS[0];
}

export function getOrganizationForTenant(key: string) {
  const tenant = getTenantByKey(key);
  return ORGANIZATIONS.find((organization) => organization.tenantId === tenant.id) ?? ORGANIZATIONS[0];
}

export function getPatientsForTenant(key: string) {
  const tenant = getTenantByKey(key);
  return SAAS_PATIENTS.filter((patient) => patient.tenantId === tenant.id);
}

export function getTeamForTenant(key: string) {
  const tenant = getTenantByKey(key);
  return TEAM_MEMBERS.filter((member) => member.tenantId === tenant.id);
}

export function getModulesForTenant(key: string) {
  const tenant = getTenantByKey(key);
  return tenant.enabledModules;
}
