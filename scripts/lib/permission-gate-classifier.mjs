const ACTION_PATTERN =
  /\b(create|update|delete|close|pause|resolve|generate|invite|assign|manage|Crear|Guardar|Cerrar|Pausar|Resolver|Generar|Exportar|Invitar|Asignar|PDF|Excel)\b/;
const EXECUTABLE_PATTERN = /onClick|mutate|Button|<button|<Link|href=|rpc\(|\.insert\(|\.update\(|\.delete\(|\.remove\(|upsert|invoke\(/;
const GUARD_PATTERN = /useAuthorization|hasPermission|RequireTenantPermission|can[A-Z]|permission|permissions|Forbidden|isPlatformSuperadmin/;
const DISABLED_PATTERN = /disabled|aria-disabled|Proximamente|Pr(?:o|\u00f3)ximamente|pendiente|requiere|sin credencial/i;
const BACKEND_PATTERN = /rpc\(|\.insert\(|\.update\(|\.delete\(|\.remove\(|upsert|invoke\(/;

export function detectPermissionAction(line) {
  if (!ACTION_PATTERN.test(line)) return false;
  if (/^\s*export\s+(default\s+)?(async\s+)?function\b/.test(line)) return false;
  if (/signOut\(/.test(line)) return false;
  if (/setActivationMode\(/.test(line)) return false;
  return EXECUTABLE_PATTERN.test(line);
}

export function classifyPermissionAction({ line, context }) {
  const sourceLine = String(line ?? "");
  const sourceContext = String(context ?? "");
  if (!detectPermissionAction(sourceLine)) return null;

  const hasGuard = GUARD_PATTERN.test(sourceContext);
  const isLimited = DISABLED_PATTERN.test(sourceContext) || DISABLED_PATTERN.test(sourceLine);
  const usesBackend = BACKEND_PATTERN.test(sourceContext) || BACKEND_PATTERN.test(sourceLine);
  const severity = classifySeverity(sourceLine);

  if (hasGuard) {
    return { category: "Protegida por UI", requiresReview: false, severity, reason: "guard_visible" };
  }

  if (isLimited) {
    return { category: "Limitada/Proximamente", requiresReview: false, severity, reason: "disabled_or_limited" };
  }

  if (usesBackend) {
    return {
      category: "Depende de backend/RLS",
      requiresReview: severity === "critical",
      severity,
      reason: "backend_or_rls_only",
    };
  }

  return {
    category: "Requiere revision",
    requiresReview: true,
    severity,
    reason: "no_visible_guard",
  };
}

export function summarizePermissionActions(actions) {
  const byCategory = new Map();
  const bySeverity = new Map();
  for (const action of actions) {
    addSummary(byCategory, action.category, action.requiresReview);
    addSummary(bySeverity, action.severity, action.requiresReview);
  }
  return {
    total: actions.length,
    requiresReview: actions.filter((item) => item.requiresReview).length,
    critical: actions.filter((item) => item.requiresReview && item.severity === "critical").length,
    byCategory: Object.fromEntries(byCategory),
    bySeverity: Object.fromEntries(bySeverity),
  };
}

function classifySeverity(line) {
  if (/delete|Eliminar|Borrar|invite|Invitar|assign|Asignar|manage|Gestionar/i.test(line)) return "critical";
  if (/create|Crear|update|Guardar|close|Cerrar|pause|Pausar|generate|Generar|Exportar|PDF|Excel/i.test(line)) return "medium";
  return "low";
}

function addSummary(map, key, requiresReview) {
  const current = map.get(key) ?? { total: 0, requiresReview: 0 };
  current.total += 1;
  if (requiresReview) current.requiresReview += 1;
  map.set(key, current);
}
