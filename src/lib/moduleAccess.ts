import { MODULE_AREAS, type ModuleArea, type ModuleDefinition } from "@/config/moduleRegistry";

export type ModuleAccessInput = {
  hasPermission?: (permission: string) => boolean;
  enabledPacks?: string[];
  enabledModules?: Array<{ moduleId: string; enabled?: boolean; packId?: string }>;
  hasTenant?: boolean;
};

export type ModuleAccessState = {
  canOpen: boolean;
  visible: boolean;
  disabled: boolean;
  label: "Activo" | "Proximamente" | "Bloqueado" | "Requiere permiso";
  reason?: string;
};

export function getModuleAccess(module: ModuleDefinition, input: ModuleAccessInput = {}): ModuleAccessState {
  const hasTenant = input.hasTenant ?? true;
  const hasPermission = input.hasPermission ?? (() => true);
  const enabledPacks = new Set(input.enabledPacks ?? []);
  const enabledModules = input.enabledModules ?? [];

  if (module.permission && !hasPermission(module.permission)) {
    return {
      canOpen: false,
      visible: false,
      disabled: true,
      label: "Requiere permiso",
      reason: `Requiere permiso ${module.permission}.`,
    };
  }

  if (module.requiresTenant && !hasTenant) {
    return {
      canOpen: false,
      visible: true,
      disabled: true,
      label: "Bloqueado",
      reason: "No hay organizacion activa.",
    };
  }

  if (module.pack && enabledPacks.size > 0 && !enabledPacks.has(module.pack)) {
    return {
      canOpen: false,
      visible: true,
      disabled: true,
      label: "Bloqueado",
      reason: `Pack ${module.pack} no habilitado para el tenant activo.`,
    };
  }

  const tenantModuleState = enabledModules.find((item) => item.moduleId === module.id);
  if (tenantModuleState && tenantModuleState.enabled === false) {
    return {
      canOpen: false,
      visible: true,
      disabled: true,
      label: "Bloqueado",
      reason: "Modulo deshabilitado para el tenant activo.",
    };
  }

  if (module.comingSoon || module.status === "coming_soon") {
    return {
      canOpen: false,
      visible: true,
      disabled: true,
      label: "Proximamente",
      reason: module.pending ?? "Modulo marcado como proximamente.",
    };
  }

  if (module.status === "blocked") {
    return {
      canOpen: false,
      visible: true,
      disabled: true,
      label: "Bloqueado",
      reason: module.blockedReason ?? module.pending ?? "Modulo bloqueado por dependencia externa.",
    };
  }

  if (!module.route) {
    return {
      canOpen: false,
      visible: true,
      disabled: true,
      label: "Bloqueado",
      reason: module.pending ?? "Este modulo requiere contexto antes de abrir.",
    };
  }

  return {
    canOpen: true,
    visible: true,
    disabled: false,
    label: "Activo",
  };
}

export function groupModulesByArea(modules: ModuleDefinition[]) {
  return MODULE_AREAS.map((area) => ({
    area,
    modules: modules
      .filter((module) => module.area === area)
      .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label)),
  })).filter((group) => group.modules.length > 0);
}

export function searchModules(modules: ModuleDefinition[], query: string) {
  const normalized = normalizeText(query);
  if (!normalized) return modules;
  return modules.filter((module) =>
    [module.id, module.label, module.description, module.area, module.permission, module.pack, module.pending, module.blockedReason]
      .filter(Boolean)
      .some((value) => normalizeText(String(value)).includes(normalized)),
  );
}

export function assertUniqueModuleIds(modules: ModuleDefinition[]) {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const module of modules) {
    if (seen.has(module.id)) duplicates.push(module.id);
    seen.add(module.id);
  }
  return duplicates;
}

export function assertUniqueActiveRoutes(modules: ModuleDefinition[]) {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const module of modules) {
    if (!module.route || module.status === "coming_soon" || module.status === "blocked") continue;
    if (seen.has(module.route)) duplicates.push(module.route);
    seen.add(module.route);
  }
  return duplicates;
}

export function getModulesForArea(modules: ModuleDefinition[], area: ModuleArea) {
  return modules.filter((module) => module.area === area).sort((left, right) => left.priority - right.priority);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
