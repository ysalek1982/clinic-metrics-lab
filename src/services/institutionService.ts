import { CLINICAL_MODULES, SUBSCRIPTION_PLANS, TENANTS } from "@/data/saas";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ClinicalModuleDefinition, ClinicalModuleId, Tenant } from "@/types/saas";

export interface InstitutionSettingsBundle {
  tenantId: string;
  name: string;
  branding: Tenant["branding"];
  settings: Tenant["settings"];
  enabledPacks: Tenant["enabledPacks"];
  enabledModules: Tenant["enabledModules"];
  status: Tenant["status"];
  planId: Tenant["planId"];
}

export interface InstitutionSettingsInput {
  tenantId: string;
  commercialName: string;
  logoInitials: string;
  primaryColor: string;
  accentColor: string;
  language: Tenant["settings"]["language"];
  timezone: string;
  unitSystem: Tenant["settings"]["unitSystem"];
  defaultFollowUpDays: number;
  strictFormulaVersioning: boolean;
  aiAssistEnabled: boolean;
  requirePlanApproval: boolean;
  enabledPacks: Tenant["enabledPacks"];
  enabledModules: ClinicalModuleId[];
  allowPackLimitOverride: boolean;
}

async function hasRemoteSession() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session.user);
}

function mapTenantModules(
  tenantId: string,
  moduleIds: ClinicalModuleId[],
  moduleCatalog: ClinicalModuleDefinition[],
  fallbackTenant: Tenant,
) {
  const catalog = moduleCatalog ?? CLINICAL_MODULES;
  const ids = moduleIds.length > 0 ? moduleIds : (fallbackTenant.enabledModules ?? []).map((module) => module.moduleId);

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

function getFallbackBundle(tenantId: string | null) {
  const tenant = TENANTS.find((item) => item.id === tenantId) ?? TENANTS[0];
  return {
    source: "demo" as const,
    data: {
      tenantId: tenant.id,
      name: tenant.name,
      branding: tenant.branding,
      settings: tenant.settings,
      enabledPacks: tenant.enabledPacks,
      enabledModules: tenant.enabledModules,
      status: tenant.status,
      planId: tenant.planId,
    } satisfies InstitutionSettingsBundle,
  };
}

export async function getInstitutionSettings(tenantId: string | null) {
  if (!supabase || !tenantId || !(await hasRemoteSession())) {
    return getFallbackBundle(tenantId);
  }

  const [tenantResult, brandingResult, settingsResult, packsResult, modulesResult, enabledModulesResult] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
    supabase.from("branding_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("tenant_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("tenant_enabled_packs").select("*").eq("tenant_id", tenantId).eq("enabled", true),
    supabase.from("clinical_modules").select("*").eq("system_enabled", true).order("sort_order"),
    supabase.from("tenant_enabled_modules").select("*").eq("tenant_id", tenantId).eq("enabled", true),
  ]);

  if (tenantResult.error || brandingResult.error || settingsResult.error || packsResult.error || !tenantResult.data) {
    throw (
      tenantResult.error ??
      brandingResult.error ??
      settingsResult.error ??
      packsResult.error ??
      new Error("No se pudo cargar la configuración institucional.")
    );
  }

  const fallback = TENANTS.find((item) => item.id === tenantId || item.slug === tenantResult.data.slug) ?? TENANTS[0];
  const moduleCatalog: ClinicalModuleDefinition[] =
    modulesResult.error || !modulesResult.data
      ? CLINICAL_MODULES
      : modulesResult.data.map((module) => ({
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

  const enabledModuleIds =
    enabledModulesResult.error || !enabledModulesResult.data
      ? fallback?.enabledModules?.map((module) => module.moduleId) ?? []
      : enabledModulesResult.data.map((module) => module.module_id as ClinicalModuleId);

  return {
    source: "supabase" as const,
    data: {
      tenantId,
      name: tenantResult.data.name,
      branding: {
        logoInitials: brandingResult.data?.logo_initials ?? fallback.branding.logoInitials ?? "NS",
        primaryColor: brandingResult.data?.primary_color ?? fallback.branding.primaryColor ?? "#13c8df",
        accentColor: brandingResult.data?.accent_color ?? fallback.branding.accentColor ?? "#a6e13a",
        commercialName: brandingResult.data?.commercial_name ?? fallback.branding.commercialName ?? tenantResult.data.name,
      },
      settings: {
        language: (settingsResult.data?.language ?? fallback.settings.language ?? "es") as Tenant["settings"]["language"],
        timezone: settingsResult.data?.timezone ?? fallback.settings.timezone ?? "America/La_Paz",
        unitSystem: (settingsResult.data?.unit_system ?? fallback.settings.unitSystem ?? "metric") as Tenant["settings"]["unitSystem"],
        defaultFollowUpDays: settingsResult.data?.default_follow_up_days ?? fallback.settings.defaultFollowUpDays ?? 14,
        strictFormulaVersioning: settingsResult.data?.strict_formula_versioning ?? fallback.settings.strictFormulaVersioning ?? true,
        aiAssistEnabled: settingsResult.data?.ai_assist_enabled ?? fallback.settings.aiAssistEnabled ?? false,
        requirePlanApproval: settingsResult.data?.require_plan_approval ?? fallback.settings.requirePlanApproval ?? true,
      },
      enabledPacks: (packsResult.data ?? []).map((item) => item.pack_id as Tenant["enabledPacks"][number]),
      enabledModules: mapTenantModules(tenantId, enabledModuleIds, moduleCatalog, fallback),
      status: tenantResult.data.status as Tenant["status"],
      planId: tenantResult.data.plan_id as Tenant["planId"],
    } satisfies InstitutionSettingsBundle,
  };
}

export async function updateInstitutionSettings(input: InstitutionSettingsInput) {
  if (!supabase) throw new Error("Supabase no está configurado.");

  const fallbackTenant = TENANTS.find((item) => item.id === input.tenantId);
  const [tenantResult, planResult, modulesResult] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", input.tenantId).maybeSingle(),
    supabase.from("subscription_plans").select("*"),
    supabase.from("clinical_modules").select("*").eq("system_enabled", true),
  ]);

  if (tenantResult.error || !tenantResult.data || planResult.error || modulesResult.error) {
    throw tenantResult.error ?? planResult.error ?? modulesResult.error ?? new Error("No se pudo validar la configuración del tenant.");
  }

  const plan =
    (planResult.data ?? []).find((item) => item.id === tenantResult.data.plan_id) ??
    (fallbackTenant ? SUBSCRIPTION_PLANS.find((item) => item.id === fallbackTenant.planId) : null);

  if (!plan) {
    throw new Error("No se pudo validar el plan del tenant.");
  }
  const enabledPackLimit = "enabled_pack_limit" in plan ? plan.enabled_pack_limit : plan.enabledPackLimit;

  if (
    !input.allowPackLimitOverride &&
    enabledPackLimit !== null &&
    enabledPackLimit !== undefined &&
    input.enabledPacks.length > enabledPackLimit
  ) {
    throw new Error(`El plan actual permite hasta ${enabledPackLimit} packs activos.`);
  }

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

  const allowedModuleIds = moduleCatalog
    .filter((module) => input.enabledPacks.includes(module.packId))
    .map((module) => module.id);

  const enabledModuleIds = input.enabledModules.filter((moduleId) => allowedModuleIds.includes(moduleId));

  const [brandingResult, settingsResult] = await Promise.all([
    supabase.from("branding_settings").upsert({
      tenant_id: input.tenantId,
      commercial_name: input.commercialName,
      logo_initials: input.logoInitials,
      primary_color: input.primaryColor,
      accent_color: input.accentColor,
      report_theme: {} satisfies Json,
    }),
    supabase.from("tenant_settings").upsert({
      tenant_id: input.tenantId,
      language: input.language,
      timezone: input.timezone,
      unit_system: input.unitSystem,
      default_follow_up_days: input.defaultFollowUpDays,
      strict_formula_versioning: input.strictFormulaVersioning,
      ai_assist_enabled: input.aiAssistEnabled,
      require_plan_approval: input.requirePlanApproval,
      settings: {} satisfies Json,
    }),
  ]);

  if (brandingResult.error || settingsResult.error) {
    throw brandingResult.error ?? settingsResult.error ?? new Error("No se pudo guardar la configuración institucional.");
  }

  const { error: disablePacksError } = await supabase
    .from("tenant_enabled_packs")
    .update({ enabled: false })
    .eq("tenant_id", input.tenantId);

  if (disablePacksError) throw disablePacksError;

  const packRows = input.enabledPacks.map((packId) => ({
    tenant_id: input.tenantId,
    pack_id: packId,
    enabled: true,
    config: {},
  }));

  if (packRows.length > 0) {
    const { error: upsertPackError } = await supabase.from("tenant_enabled_packs").upsert(packRows);
    if (upsertPackError) throw upsertPackError;
  }

  const { error: disableModulesError } = await supabase
    .from("tenant_enabled_modules")
    .update({ enabled: false })
    .eq("tenant_id", input.tenantId);

  if (disableModulesError) throw disableModulesError;

  const moduleRows = enabledModuleIds.map((moduleId) => ({
    tenant_id: input.tenantId,
    module_id: moduleId,
    enabled: true,
    config: {},
  }));

  if (moduleRows.length > 0) {
    const { error: upsertModuleError } = await supabase.from("tenant_enabled_modules").upsert(moduleRows);
    if (upsertModuleError) throw upsertModuleError;
  }

  return getInstitutionSettings(input.tenantId);
}
