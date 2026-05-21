export const CLINICAL_CLAIM_PATTERNS = [
  { id: "probable_diagnosis", label: "diagnostico probable", regex: /diagn[oó]stico probable/i },
  { id: "dose_recommendation", label: "recomiendo dosis", regex: /recomiendo dosis/i },
  { id: "must_administer", label: "debe administrarse", regex: /debe administrarse/i },
  { id: "indicated_treatment", label: "tratamiento indicado", regex: /tratamiento indicado/i },
  { id: "prognosis", label: "pronostico", regex: /pron[oó]stico/i },
  { id: "prescribe", label: "prescribir", regex: /prescribir|prescribe|prescripci[oó]n/i },
  { id: "medication", label: "medicacion", regex: /medicaci[oó]n/i },
  { id: "cure", label: "cura", regex: /\bcura\b|\bcurar\b/i },
  { id: "generative_ai_active", label: "IA generativa activa", regex: /IA generativa activa/i },
  { id: "automatic_diagnosis", label: "diagnostico automatico", regex: /diagn[oó]stico autom[aá]tico/i },
];

const SAFE_NEGATION_PATTERN =
  /\b(no|sin|prohibid[oa]s?|evitar|pendiente|bloquead[oa]|detectar|buscar|guardrail|ejemplo prohibido|no debe|no genera|no diagnostica|no prescribe|no recomienda)\b/i;
const NUTRITION_PRESCRIPTION_CONTEXT =
  /nutrici[oó]n|nutricional|dieta|f[oó]rmula|plan(?:es)?|energ[eé]tica|kcal|macro|fluid/i;

export function matchClinicalClaimPatterns(line = "") {
  return CLINICAL_CLAIM_PATTERNS.filter((pattern) => pattern.regex.test(String(line)));
}

export function classifyClinicalClaim(file, patternId, line = "") {
  const normalized = String(file ?? "").replace(/\\/g, "/");
  const sample = String(line ?? "");
  const safeContext = SAFE_NEGATION_PATTERN.test(sample);

  if (normalized.includes(".test.") || normalized.includes(".spec.")) {
    return allowed("Permitido en tests", "Asercion negativa o fixture local.");
  }

  if (patternId === "prescribe" && NUTRITION_PRESCRIPTION_CONTEXT.test(sample)) {
    return allowed("Uso nutricional no farmacologico", "Prescripcion nutricional o dieta, no medicacion ni dosis farmacologica.");
  }

  if (normalized.startsWith("scripts/")) {
    return allowed("Permitido en scripts", "Guardrail local o clasificador; no alimenta UI.");
  }

  if (normalized.startsWith("docs/")) {
    return safeContext
      ? allowed("Permitido en docs como ejemplo prohibido", "Documento describe una restriccion o bloqueo.")
      : review("Revisar docs", "La frase clinica aparece sin negacion clara.");
  }

  if (normalized.startsWith("src/domain/copilot/")) {
    return safeContext
      ? allowed("Permitido como regla negativa", "Regla local explicita lo que no hace.")
      : blocked("Riesgo en reglas", `Claim clinico no permitido: ${patternId}`);
  }

  if (normalized.startsWith("src/")) {
    return safeContext
      ? allowed("Permitido como disclaimer UI", "Texto visible niega la capacidad clinica.")
      : blocked("Riesgo en UI", `Claim clinico no permitido: ${patternId}`);
  }

  return safeContext
    ? allowed("Permitido por contexto negativo", "La linea expresa una restriccion.")
    : review("Uso dudoso", "Revisar si puede prometer diagnostico, tratamiento o IA generativa.");
}

export function summarizeClinicalClaims(findings) {
  const byCategory = new Map();
  const byPattern = new Map();

  for (const finding of findings) {
    addSummary(byCategory, finding.category, finding.requiresReview);
    addSummary(byPattern, finding.patternId, finding.requiresReview);
  }

  return {
    total: findings.length,
    requiresReview: findings.filter((item) => item.requiresReview).length,
    riskyUi: findings.filter((item) => item.category === "Riesgo en UI").length,
    riskyRules: findings.filter((item) => item.category === "Riesgo en reglas").length,
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
