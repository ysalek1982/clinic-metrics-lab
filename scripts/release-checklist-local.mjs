import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "release");
const docsDir = path.join(repoRoot, "docs");

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const checks = [
  {
    area: "Calidad local",
    status: "ready_local",
    evidence: latestArtifact("artifacts/smoke", /^smoke-routes-local-/),
    risk: "No reemplaza smoke autenticado.",
  },
  {
    area: "Acciones UI",
    status: latestUiActionStatus(),
    evidence: latestArtifact("artifacts/ui-audit", /^ui-actions-/),
    risk: "Revisar riesgos medios/altos antes de demo con usuarios reales.",
  },
  {
    area: "Accesibilidad basica",
    status: "ready_local",
    evidence: latestArtifact("artifacts/accessibility", /^accessibility-audit-/),
    risk: "No es certificacion WCAG completa.",
  },
  {
    area: "Permission gates UI",
    status: latestPermissionStatus(),
    evidence: latestArtifact("artifacts/security", /^permission-gates-/),
    risk: "RLS sigue siendo el control final; QA P0 requiere usuarios reales.",
  },
  {
    area: "Demo usage",
    status: latestDemoStatus(),
    evidence: latestArtifact("artifacts/security", /^demo-usage-/),
    risk: "Validar de nuevo con sesion autenticada real.",
  },
  {
    area: "RLS/migraciones",
    status: "review_required",
    evidence: latestArtifact("artifacts/security", /^migrations-rls-/),
    risk: "No sustituye pruebas multi-tenant remotas.",
  },
  {
    area: "Edge Function admin-invite-user",
    status: envPresent("SUPABASE_ACCESS_TOKEN") ? "ready_to_deploy" : "blocked_credential",
    evidence: "supabase/functions/admin-invite-user/index.ts",
    risk: "No desplegar sin token autorizado.",
  },
  {
    area: "QA Seguridad P0",
    status: qaCredentialsReady() ? "ready_to_run" : "blocked_users_or_credentials",
    evidence: "scripts/qa-security-p0.mjs",
    risk: "Requiere usuarios Auth QA confirmados.",
  },
  {
    area: "E2E Enteral",
    status: envPresent("E2E_EMAIL") && envPresent("E2E_PASSWORD") ? "ready_to_run" : "blocked_credential",
    evidence: "scripts/e2e-enteral-flow.mjs",
    risk: "No cerrar Fase 9 sin UI E2E autenticado.",
  },
  {
    area: "Pediatria WHO/OMS",
    status: "blocked_clinical_input",
    evidence: "docs/references/pediatric-growth-official-sources.md",
    risk: "Faltan CSV oficiales normalizados.",
  },
  {
    area: "report.exported",
    status: "blocked_authenticated_evidence",
    evidence: "docs/known-limitations.md",
    risk: "Falta confirmacion visible en /app/audit.",
  },
];

const output = {
  generatedAt: new Date().toISOString(),
  checks,
  summary: {
    readyLocal: checks.filter((check) => check.status === "ready_local").length,
    blocked: checks.filter((check) => check.status.startsWith("blocked")).length,
    reviewRequired: checks.filter((check) => check.status === "review_required").length,
  },
};

const artifactPath = path.join(artifactDir, `release-checklist-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(output, null, 2));
writeDoc(output, artifactPath);

console.log(`Release checklist local: ${artifactPath}`);

function latestArtifact(relativeDir, pattern) {
  const dir = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(dir)) return "Sin artifact local";
  const files = fs
    .readdirSync(dir)
    .filter((file) => pattern.test(file))
    .sort()
    .reverse();
  return files[0] ? path.join(relativeDir, files[0]).replace(/\\/g, "/") : "Sin artifact local";
}

function latestUiActionStatus() {
  const artifact = latestArtifact("artifacts/ui-audit", /^ui-actions-/);
  if (artifact === "Sin artifact local") return "review_required";
  try {
    const payload = JSON.parse(fs.readFileSync(path.join(repoRoot, artifact), "utf8"));
    return payload.status === "passed" ? "ready_local" : "review_required";
  } catch {
    return "review_required";
  }
}

function latestPermissionStatus() {
  const payload = latestJson("artifacts/security", /^permission-gates-/);
  return payload?.summary?.critical === 0 && payload?.summary?.requiresReview === 0 ? "ready_local" : "review_required";
}

function latestDemoStatus() {
  const payload = latestJson("artifacts/security", /^demo-usage-/);
  return payload?.summary?.prohibited === 0 && payload?.summary?.doubtful === 0 ? "ready_local" : "review_required";
}

function latestJson(relativeDir, pattern) {
  const artifact = latestArtifact(relativeDir, pattern);
  if (artifact === "Sin artifact local") return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, artifact), "utf8"));
  } catch {
    return null;
  }
}

function envPresent(name) {
  return Boolean(process.env[name]);
}

function qaCredentialsReady() {
  return [
    "QA_NO_MEMBERSHIP_EMAIL",
    "QA_NO_MEMBERSHIP_PASSWORD",
    "QA_HSM_EMAIL",
    "QA_HSM_PASSWORD",
    "QA_TENANT_B_EMAIL",
    "QA_TENANT_B_PASSWORD",
    "QA_TENANT_B_ID",
  ].every(envPresent);
}

function writeDoc(payload, artifactPath) {
  const rows = payload.checks
    .map((check) => `| ${check.area} | ${check.status} | \`${check.evidence}\` | ${check.risk} |`)
    .join("\n");
  fs.writeFileSync(
    path.join(docsDir, "release-checklist-current.md"),
    `# Checklist local de release para piloto

Generado: ${payload.generatedAt}

- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`
- Nota: este checklist no cierra bloqueos que requieren credenciales, usuarios Auth o CSV oficiales.

| Area | Estado | Evidencia | Riesgo |
|---|---|---|---|
${rows}
`,
  );
}
