export const SECRET_PATTERNS = [
  { id: "supabase_access_token", label: "SUPABASE_ACCESS_TOKEN", regex: /SUPABASE_ACCESS_TOKEN/ },
  { id: "supabase_db_password", label: "SUPABASE_DB_PASSWORD", regex: /SUPABASE_DB_PASSWORD/ },
  { id: "supabase_service_role", label: "SUPABASE_SERVICE_ROLE", regex: /SUPABASE_SERVICE_ROLE/ },
  { id: "service_role", label: "SERVICE_ROLE", regex: /SERVICE_ROLE|service_role/ },
  { id: "postgres_url", label: "postgresql://", regex: /postgresql:\/\// },
  { id: "e2e_password", label: "E2E_PASSWORD", regex: /E2E_PASSWORD/ },
  { id: "qa_password", label: "QA_PASSWORD", regex: /QA_PASSWORD|QA_[A-Z0-9_]*_PASSWORD/ },
  { id: "known_secret_fragment", label: "A907", regex: /A907/ },
  { id: "jwt_prefix", label: "eyJ", regex: /eyJ/ },
  { id: "storage_state", label: "storageState", regex: /storageState|playwright\/\.auth|playwright\\\.auth/ },
];

const PLACEHOLDER_PATTERN = /\b(ausente|missing|placeholder|replace_me|example|ejemplo|sin valor|no se imprimen|process\.env|Deno\.env|get\(|required|pendiente)\b/i;

export function matchSecretPatterns(line = "") {
  return SECRET_PATTERNS.filter((pattern) => pattern.regex.test(String(line)));
}

export function classifySecretHit(file, patternId, line = "") {
  const normalized = String(file ?? "").replace(/\\/g, "/");
  const sample = String(line ?? "");
  const looksPlaceholder = PLACEHOLDER_PATTERN.test(sample);
  const isServiceRole = patternId === "supabase_service_role" || patternId === "service_role";

  if (normalized.includes(".test.") || normalized.includes(".spec.")) {
    return allowed("Permitido en tests", "Fixture o asercion de guardrail local.");
  }

  if (normalized.includes("node_modules/") || normalized.includes("/dist/") || normalized.includes("/build/")) {
    return allowed("Ignorado por build/dependency", "No se considera fuente versionada del proyecto.");
  }

  if (normalized === ".gitignore" || normalized.endsWith("/.gitignore")) {
    return allowed("Regla gitignore", "Patron sensible esta ignorado, no expuesto.");
  }

  if (normalized === ".env.example" || normalized.endsWith("/.env.example")) {
    return allowed("Placeholder en env example", "Variable documentada sin valor real.");
  }

  if (/^\.env(\.|$)/.test(normalized)) {
    return allowed("Archivo env local ignorado", "Archivo local no versionable; revisar gitignore, no imprimir valores.");
  }

  if (normalized.includes("playwright/.auth") || normalized.includes("storageState.json")) {
    return blocked("Riesgo repo", "Storage state o sesion no debe versionarse.");
  }

  if (normalized.startsWith("supabase/functions/") && isServiceRole) {
    return allowed("Edge Function server-side", "Service role permitido solo dentro de Edge Function.");
  }

  if (normalized.startsWith("src/") && (isServiceRole || /password|token|postgres|jwt/i.test(patternId))) {
    return blocked("Riesgo frontend", "Credencial o token no debe existir en frontend ejecutable.");
  }

  if (normalized.startsWith("docs/")) {
    if (looksPlaceholder || /secretos|patr[oó]n|fragmento|buscar|\$env:|dbUrl|variable/i.test(sample)) {
      return allowed("Documentacion con placeholder", "Documento menciona variable, patron o comando sin revelar valor.");
    }
    if (patternId === "jwt_prefix" || patternId === "known_secret_fragment" || patternId === "postgres_url") {
      return review("Revisar docs", "Patron con forma de secreto debe revisarse manualmente.");
    }
    return allowed("Documentacion con placeholder", "Documento menciona variable o bloqueo sin revelar valor.");
  }

  if (normalized.startsWith("scripts/")) {
    return allowed("Script de guardrail", "Herramienta local detecta nombres de variables sin imprimir valores.");
  }

  if (normalized.startsWith("artifacts/")) {
    return allowed("Artifact de auditoria/readiness", "Artifact generado con nombres de variables o estado, sin valores sensibles impresos.");
  }

  if (looksPlaceholder) {
    return allowed("Placeholder o variable de entorno", "Referencia sin valor sensible.");
  }

  return review("Uso dudoso", "Revisar manualmente sin imprimir el valor.");
}

export function summarizeSecretHits(findings) {
  const byCategory = new Map();
  const byPattern = new Map();

  for (const finding of findings) {
    addSummary(byCategory, finding.category, finding.requiresReview);
    addSummary(byPattern, finding.patternId, finding.requiresReview);
  }

  return {
    total: findings.length,
    requiresReview: findings.filter((item) => item.requiresReview).length,
    frontendRisk: findings.filter((item) => item.category === "Riesgo frontend").length,
    repoRisk: findings.filter((item) => item.category === "Riesgo repo").length,
    byCategory: Object.fromEntries(byCategory),
    byPattern: Object.fromEntries(byPattern),
  };
}

function allowed(category, action) {
  return { category, allowed: true, requiresReview: false, action };
}

function blocked(category, action) {
  return { category, allowed: false, requiresReview: true, action };
}

function review(category, action) {
  return { category, allowed: false, requiresReview: true, action };
}

function addSummary(map, key, requiresReview) {
  const current = map.get(key) ?? { total: 0, requiresReview: 0 };
  current.total += 1;
  if (requiresReview) current.requiresReview += 1;
  map.set(key, current);
}
