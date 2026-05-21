export const DEMO_USAGE_PATTERNS = [
  { type: "demo_import", regex: /src\/data\/demo|@\/data\/demo|\.\.\/data\/demo/ },
  { type: "saas_seed_import", regex: /src\/data\/saas|@\/data\/saas|\.\.\/data\/saas/ },
  { type: "clinical_seed_import", regex: /src\/data\/clinical|@\/data\/clinical|\.\.\/data\/clinical/ },
  { type: "source_demo", regex: /source:\s*["']demo["']/ },
  { type: "allow_demo", regex: /allowDemo|isDemoMode/ },
];

export function classifyDemoUsage(file, type, line = "") {
  const normalized = file.replace(/\\/g, "/");
  const sample = String(line);

  if (normalized.includes(".test.") || normalized.includes(".spec.")) {
    return allowed("Uso permitido en tests", "Fixture o asercion de prueba local.");
  }

  if (normalized.startsWith("docs/")) {
    return allowed("Uso permitido en docs", "Documento operativo o auditoria; no alimenta UI.");
  }

  if (normalized.startsWith("scripts/")) {
    return allowed("Uso permitido en scripts de auditoria", "Herramienta local de diagnostico.");
  }

  if (normalized.startsWith("src/data/")) {
    return allowed("Uso permitido sin sesion", "Fuente demo aislada; debe permanecer fuera de vistas autenticadas.");
  }

  if (normalized.includes("features/auth") || normalized.includes("view-source")) {
    return allowed("Uso permitido sin sesion", "Gate de modo demo antes de resolver sesion autenticada.");
  }

  if (
    (normalized.startsWith("src/hooks/") || normalized.startsWith("src/services/")) &&
    ["allow_demo", "source_demo", "saas_seed_import", "clinical_seed_import", "demo_import"].includes(type)
  ) {
    return allowed("Uso permitido sin sesion", "Uso condicionado por gate de sesion o fuente remota.");
  }

  if (normalized.startsWith("src/pages/app/") && ["demo_import", "saas_seed_import", "clinical_seed_import", "source_demo"].includes(type)) {
    return blocked("Uso prohibido en rutas autenticadas", "No debe respaldar vistas /app autenticadas.");
  }

  if (type === "allow_demo" && /auth|session|demo/i.test(sample)) {
    return allowed("Uso permitido sin sesion", "Bandera de modo demo, no fuente clinica.");
  }

  return review("Uso dudoso", "Revisar manualmente si puede alimentar una ruta autenticada.");
}

export function summarizeDemoUsage(findings) {
  const byCategory = new Map();
  const byType = new Map();

  for (const finding of findings) {
    addSummary(byCategory, finding.category, finding.requiresReview);
    addSummary(byType, finding.type, finding.requiresReview);
  }

  return {
    total: findings.length,
    requiresReview: findings.filter((item) => item.requiresReview).length,
    prohibited: findings.filter((item) => item.category === "Uso prohibido en rutas autenticadas").length,
    doubtful: findings.filter((item) => item.category === "Uso dudoso").length,
    byCategory: Object.fromEntries(byCategory),
    byType: Object.fromEntries(byType),
  };
}

function allowed(category, action) {
  return { category, usageAllowed: true, requiresReview: false, action };
}

function blocked(category, action) {
  return { category, usageAllowed: false, requiresReview: true, action };
}

function review(category, action) {
  return { category, usageAllowed: false, requiresReview: true, action };
}

function addSummary(map, key, requiresReview) {
  const current = map.get(key) ?? { total: 0, requiresReview: 0 };
  current.total += 1;
  if (requiresReview) current.requiresReview += 1;
  map.set(key, current);
}
