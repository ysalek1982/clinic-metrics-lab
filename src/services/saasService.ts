import { PACK_LIST } from "@/data/packs";
import { CLINICAL_MODULES, SUBSCRIPTION_PLANS, TENANTS } from "@/data/saas";
import { supabase } from "@/integrations/supabase/client";
import type {
  ClinicalModuleDefinition,
  PlatformTenantSummary,
  SpecialtyPackCatalogItem,
  SubscriptionPlan,
  Tenant,
  TenantEnabledModule,
} from "@/types/saas";

export interface SaasCatalogResult<T> {
  source: "supabase" | "demo";
  data: T;
}

export interface TenantBlueprintInput {
  name: string;
  slug: string;
  planId: SubscriptionPlan["id"];
  institutionType: Tenant["institutionType"];
  region: string;
  language: Tenant["settings"]["language"];
  timezone: string;
  unitSystem: Tenant["settings"]["unitSystem"];
  primaryColor: string;
  accentColor: string;
  logoInitials: string;
  enabledPacks: Tenant["enabledPacks"];
  organizationName: string | null;
  branchName: string | null;
  departmentName: string | null;
  serviceName: string | null;
}

function mapTenantModules(
  tenantId: string,
  moduleIds: string[] | undefined,
  moduleCatalog: ClinicalModuleDefinition[] | undefined,
  local: Tenant | undefined,
): TenantEnabledModule[] {
  const ids = moduleIds ?? local?.enabledModules?.map((module) => module.moduleId) ?? [];
  const catalog = moduleCatalog ?? CLINICAL_MODULES;

  return catalog
    .filter((module) => ids.includes(module.id))
    .map((module) => ({
      tenantId,
      moduleId: module.id,
      packId: module.packId,
      slug: module.slug,
      enabled: true,
      enabledAt: new Date().toISOString(),
      config: {},
    }));
}

function defaultTenantFromRemote(remote: {
  id: string;
  slug: string;
  name?: string | null;
  status?: string | null;
  planId?: string | null;
  institutionType?: string | null;
  region?: string | null;
  trialEndsAt: string | null;
  renewalDate: string | null;
  branding?: {
    commercialName: string;
    logoInitials: string;
    primaryColor: string;
    accentColor: string;
  };
  settings?: {
    language: string;
    timezone: string;
    unitSystem: string;
    defaultFollowUpDays: number;
    strictFormulaVersioning: boolean;
    aiAssistEnabled: boolean;
    requirePlanApproval: boolean;
  };
  limits?: Tenant["limits"];
  usage?: Tenant["usage"];
  enabledPacks?: Tenant["enabledPacks"];
  enabledModules?: string[];
  moduleCatalog: ClinicalModuleDefinition[];
}): Tenant {
  const local = TENANTS.find((tenant) => tenant.slug === remote.slug || tenant.id === remote.id);
  const tenantName = remote.name ?? local?.name ?? "Tenant sin nombre";

  return {
    id: remote.id,
    slug: remote.slug,
    name: tenantName,
    status: (remote.status ?? local?.status ?? "active") as Tenant["status"],
    planId: (remote.planId ?? local?.planId ?? "foundation") as Tenant["planId"],
    institutionType: (remote.institutionType ?? local?.institutionType ?? "clinic") as Tenant["institutionType"],
    region: remote.region ?? local?.region ?? "BO",
    trialEndsAt: remote.trialEndsAt ?? undefined,
    renewalDate: remote.renewalDate ?? undefined,
    branding: remote.branding
      ? {
          logoInitials: remote.branding.logoInitials,
          primaryColor: remote.branding.primaryColor,
          accentColor: remote.branding.accentColor,
          commercialName: remote.branding.commercialName,
        }
      : local?.branding ?? {
          logoInitials: tenantName
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase(),
          primaryColor: "#13c8df",
          accentColor: "#a6e13a",
          commercialName: tenantName,
        },
    settings: remote.settings
      ? {
          language: remote.settings.language as Tenant["settings"]["language"],
          timezone: remote.settings.timezone,
          unitSystem: remote.settings.unitSystem as Tenant["settings"]["unitSystem"],
          defaultFollowUpDays: remote.settings.defaultFollowUpDays,
          strictFormulaVersioning: remote.settings.strictFormulaVersioning,
          aiAssistEnabled: remote.settings.aiAssistEnabled,
          requirePlanApproval: remote.settings.requirePlanApproval,
        }
      : local?.settings ?? {
          language: "es",
          timezone: "America/La_Paz",
          unitSystem: "metric",
          defaultFollowUpDays: 14,
          strictFormulaVersioning: true,
          aiAssistEnabled: false,
          requirePlanApproval: true,
        },
    limits: remote.limits ?? local?.limits ?? {
      users: null,
      branches: null,
      activePatients: null,
      enabledPacks: null,
      monthlyReports: null,
      aiEvents: null,
      storageGb: null,
    },
    usage: remote.usage ?? local?.usage ?? {
      users: 0,
      branches: 0,
      activePatients: 0,
      enabledPacks: 0,
      monthlyReports: 0,
      aiEvents: 0,
      storageGb: 0,
    },
    enabledPacks: remote.enabledPacks ?? local?.enabledPacks ?? [],
    enabledModules: mapTenantModules(remote.id, remote.enabledModules, remote.moduleCatalog, local),
  };
}

async function hasRemoteSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session.user);
}

export async function getSubscriptionPlansCatalog(): Promise<SaasCatalogResult<SubscriptionPlan[]>> {
  if (!supabase) {
    return { source: "demo", data: SUBSCRIPTION_PLANS };
  }

  const { data, error } = await supabase.from("subscription_plans").select("*").order("name");

  if (error || !data) {
    if (await hasRemoteSession()) {
      throw error ?? new Error("No se pudo cargar el catálogo de planes.");
    }
    return { source: "demo", data: SUBSCRIPTION_PLANS };
  }

  const plans: SubscriptionPlan[] = data.map((plan) => ({
    id: plan.id as SubscriptionPlan["id"],
    name: plan.name,
    marketPosition: plan.market_position,
    monthlyPriceUsd: plan.monthly_price_usd,
    includedUsers: plan.included_users,
    activePatientLimit: plan.active_patient_limit,
    branchLimit: plan.branch_limit,
    enabledPackLimit: plan.enabled_pack_limit,
    aiEnabled: plan.ai_enabled,
    whiteLabelEnabled: plan.white_label_enabled,
    features: Array.isArray(plan.features) ? plan.features.filter((item): item is string => typeof item === "string") : [],
  }));

  return { source: "supabase", data: plans };
}

export async function getTenantCatalog(): Promise<SaasCatalogResult<Tenant[]>> {
  if (!supabase) {
    return { source: "demo", data: TENANTS };
  }

  const remoteSession = await hasRemoteSession();

  const [
    tenantsResult,
    brandingResult,
    settingsResult,
    limitsResult,
    countersResult,
    packsResult,
    modulesResult,
    enabledModulesResult,
  ] = await Promise.all([
    supabase.from("tenants").select("*").order("name"),
    supabase.from("branding_settings").select("*"),
    supabase.from("tenant_settings").select("*"),
    supabase.from("tenant_usage_limits").select("*"),
    supabase.from("tenant_usage_counters").select("*"),
    supabase.from("tenant_enabled_packs").select("*").eq("enabled", true),
    supabase.from("clinical_modules").select("*").eq("system_enabled", true).order("sort_order"),
    supabase.from("tenant_enabled_modules").select("*").eq("enabled", true),
  ]);

  if (
    tenantsResult.error ||
    brandingResult.error ||
    settingsResult.error ||
    limitsResult.error ||
    countersResult.error ||
    packsResult.error ||
    modulesResult.error ||
    enabledModulesResult.error ||
    !tenantsResult.data
  ) {
    if (remoteSession) {
      throw (
        tenantsResult.error ??
        brandingResult.error ??
        settingsResult.error ??
        limitsResult.error ??
        countersResult.error ??
        packsResult.error ??
        modulesResult.error ??
        enabledModulesResult.error ??
        new Error("No se pudo cargar el catálogo de tenants.")
      );
    }

    return { source: "demo", data: TENANTS };
  }

  const brandings = new Map((brandingResult.data ?? []).map((item) => [item.tenant_id, item]));
  const settings = new Map((settingsResult.data ?? []).map((item) => [item.tenant_id, item]));
  const limits = new Map((limitsResult.data ?? []).map((item) => [item.tenant_id, item]));
  const counters = new Map((countersResult.data ?? []).map((item) => [item.tenant_id, item]));
  const packs = new Map<string, Tenant["enabledPacks"]>();
  const enabledModules = new Map<string, string[]>();
  const moduleCatalog: ClinicalModuleDefinition[] = (modulesResult.data ?? []).map((module) => ({
    id: module.id as ClinicalModuleDefinition["id"],
    packId: module.pack_id as ClinicalModuleDefinition["packId"],
    slug: module.slug,
    name: module.name,
    shortName: module.short_name,
    description: module.description,
    routeKey: module.route_key,
    defaultEnabled: module.default_enabled,
    sortOrder: module.sort_order,
    systemEnabled: module.system_enabled,
  }));

  for (const item of packsResult.data ?? []) {
    const current = packs.get(item.tenant_id) ?? [];
    current.push(item.pack_id as Tenant["enabledPacks"][number]);
    packs.set(item.tenant_id, current);
  }

  for (const item of enabledModulesResult.data ?? []) {
    const current = enabledModules.get(item.tenant_id) ?? [];
    current.push(item.module_id);
    enabledModules.set(item.tenant_id, current);
  }

  const merged = tenantsResult.data.map((item) => {
    const branding = brandings.get(item.id);
    const tenantSettings = settings.get(item.id);
    const tenantLimits = limits.get(item.id);
    const tenantCounters = counters.get(item.id);

    return defaultTenantFromRemote({
      id: item.id,
      slug: item.slug,
      name: item.name,
      status: item.status,
      planId: item.plan_id,
      institutionType: item.institution_type,
      region: item.region,
      trialEndsAt: item.trial_ends_at,
      renewalDate: item.renewal_date,
      branding: branding
        ? {
            commercialName: branding.commercial_name,
            logoInitials: branding.logo_initials,
            primaryColor: branding.primary_color,
            accentColor: branding.accent_color,
          }
        : undefined,
      settings: tenantSettings
        ? {
            language: tenantSettings.language,
            timezone: tenantSettings.timezone,
            unitSystem: tenantSettings.unit_system,
            defaultFollowUpDays: tenantSettings.default_follow_up_days,
            strictFormulaVersioning: tenantSettings.strict_formula_versioning,
            aiAssistEnabled: tenantSettings.ai_assist_enabled,
            requirePlanApproval: tenantSettings.require_plan_approval,
          }
        : undefined,
      limits: tenantLimits
        ? {
            users: tenantLimits.users_limit,
            branches: tenantLimits.branches_limit,
            activePatients: tenantLimits.active_patients_limit,
            enabledPacks: tenantLimits.enabled_packs_limit,
            monthlyReports: tenantLimits.monthly_reports_limit,
            aiEvents: tenantLimits.ai_events_limit,
            storageGb: tenantLimits.storage_gb_limit,
          }
        : undefined,
      usage: tenantCounters
        ? {
            users: tenantCounters.users_count,
            branches: tenantCounters.branches_count,
            activePatients: tenantCounters.active_patients_count,
            enabledPacks: tenantCounters.enabled_packs_count,
            monthlyReports: tenantCounters.monthly_reports_count,
            aiEvents: tenantCounters.ai_events_count,
            storageGb: tenantCounters.storage_gb,
          }
        : undefined,
      enabledPacks: packs.get(item.id),
      enabledModules: enabledModules.get(item.id),
      moduleCatalog,
    });
  });

  if (merged.length === 0 && !remoteSession) {
    return { source: "demo", data: TENANTS };
  }

  return { source: "supabase", data: merged };
}

export async function getPlatformTenantSummaries(): Promise<SaasCatalogResult<PlatformTenantSummary[]>> {
  const tenantCatalog = await getTenantCatalog();

  return {
    source: tenantCatalog.source,
    data: tenantCatalog.data.map((tenant) => ({
      tenantId: tenant.id,
      name: tenant.name ?? "Tenant sin nombre",
      status: tenant.status,
      planId: tenant.planId,
      users: tenant.usage?.users ?? 0,
      activePatients: tenant.usage?.activePatients ?? 0,
      enabledPacks: tenant.usage?.enabledPacks ?? (tenant.enabledPacks ?? []).length,
      monthlyReports: tenant.usage?.monthlyReports ?? 0,
      lastActivityAt: tenant.renewalDate ?? new Date().toISOString(),
    })),
  };
}

export async function getSpecialtyPackCatalog(): Promise<SaasCatalogResult<SpecialtyPackCatalogItem[]>> {
  if (!supabase) {
    return {
      source: "demo",
      data: PACK_LIST.map((pack) => ({
        id: pack.id,
        name: pack.name,
        category: pack.id,
        description: pack.description,
        systemEnabled: true,
        defaultModules: CLINICAL_MODULES.filter((module) => module.packId === pack.id).map((module) => module.id),
      })),
    };
  }

  const { data, error } = await supabase.from("specialty_packs").select("*").order("name");

  if (error || !data) {
    if (await hasRemoteSession()) {
      throw error ?? new Error("No se pudo cargar el catálogo de packs.");
    }
    return {
      source: "demo",
      data: PACK_LIST.map((pack) => ({
        id: pack.id,
        name: pack.name,
        category: pack.id,
        description: pack.description,
        systemEnabled: true,
        defaultModules: CLINICAL_MODULES.filter((module) => module.packId === pack.id).map((module) => module.id),
      })),
    };
  }

  return {
    source: "supabase",
    data: data.map((pack) => ({
      id: pack.id as SpecialtyPackCatalogItem["id"],
      name: pack.name,
      category: pack.category,
      description: pack.description,
      systemEnabled: pack.system_enabled,
      defaultModules: Array.isArray(pack.default_modules)
        ? pack.default_modules.filter((item): item is SpecialtyPackCatalogItem["defaultModules"][number] => typeof item === "string")
        : [],
    })),
  };
}

export async function getClinicalModuleCatalog(): Promise<SaasCatalogResult<ClinicalModuleDefinition[]>> {
  if (!supabase) {
    return { source: "demo", data: CLINICAL_MODULES };
  }

  const { data, error } = await supabase
    .from("clinical_modules")
    .select("*")
    .eq("system_enabled", true)
    .order("sort_order");

  if (error || !data) {
    if (await hasRemoteSession()) {
      throw error ?? new Error("No se pudo cargar el catálogo de módulos.");
    }
    return { source: "demo", data: CLINICAL_MODULES };
  }

  return {
    source: "supabase",
    data: data.map((module) => ({
      id: module.id as ClinicalModuleDefinition["id"],
      packId: module.pack_id as ClinicalModuleDefinition["packId"],
      slug: module.slug,
      name: module.name,
      shortName: module.short_name,
      description: module.description,
      routeKey: module.route_key,
      defaultEnabled: module.default_enabled,
      sortOrder: module.sort_order,
      systemEnabled: module.system_enabled,
    })),
  };
}

export async function createTenantBlueprint(input: TenantBlueprintInput) {
  if (!supabase) {
    throw new Error("Supabase no est configurado.");
  }

  const { data, error } = await supabase.rpc("create_tenant_blueprint", {
    p_name: input.name,
    p_slug: input.slug,
    p_plan_id: input.planId,
    p_institution_type: input.institutionType,
    p_region: input.region,
    p_language: input.language,
    p_timezone: input.timezone,
    p_unit_system: input.unitSystem,
    p_primary_color: input.primaryColor,
    p_accent_color: input.accentColor,
    p_logo_initials: input.logoInitials,
    p_enabled_packs: input.enabledPacks,
    p_organization_name: input.organizationName ?? null,
    p_branch_name: input.branchName ?? null,
    p_department_name: input.departmentName ?? null,
    p_service_name: input.serviceName ?? null,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}
