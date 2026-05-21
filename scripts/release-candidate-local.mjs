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
  row("Build/lint/tests/smoke", "ready_local", latestArtifact("artifacts/readiness", /^pilot-readiness-/), "Validacion local automatizada; no sustituye QA multi-tenant."),
  row("Visual parity", "ready_local", latestArtifact("artifacts/visual-parity", /^prototype-parity-/), "Paridad local documentada; el prototipo es referencia visual, no datos."),
  row("Copilot contextual", "ready_local", latestArtifact("artifacts/prototype-deep", /^prototype-deep-analysis-/), "Asistente local protegido por ai.assist; tareas/timeline/consulta local; no usa IA generativa ni diagnostica."),
  row("UI actions", latestUiStatus(), latestArtifact("artifacts/ui-audit", /^ui-actions-/), "Riesgos criticos deben mantenerse en cero."),
  row("Permission gates", latestPermissionStatus(), latestArtifact("artifacts/security", /^permission-gates-/), "RLS/backend siguen siendo control final."),
  row("Demo usage", latestDemoStatus(), latestArtifact("artifacts/security", /^demo-usage-/), "Validar nuevamente con sesion autenticada real."),
  row("RLS/migrations", "review_required", latestArtifact("artifacts/security", /^migrations-rls-/), "No reemplaza QA P0 con usuarios reales."),
  row("Edge Function deploy", envPresent("SUPABASE_ACCESS_TOKEN") ? "ready_to_deploy" : "blocked_credential", "supabase/functions/admin-invite-user/index.ts", "Falta token si sigue bloqueado."),
  row("QA Seguridad P0", qaCredentialsReady() ? "ready_to_run" : "blocked_users_or_credentials", "scripts/qa-security-p0.mjs", "Requiere usuarios Auth QA confirmados."),
  row("E2E Enteral", e2eReady() ? "ready_to_run" : "blocked_credential", "scripts/e2e-enteral-flow.mjs", "Requiere E2E_EMAIL/E2E_PASSWORD."),
  row("report.exported", "blocked_authenticated_evidence", "docs/known-limitations.md", "Falta evidencia visible en /app/audit."),
  row("Pediatria WHO/OMS completa", "blocked_clinical_input", "docs/references/pediatric-growth-official-sources.md", "Faltan CSV oficiales completos."),
];

const payload = {
  generatedAt: new Date().toISOString(),
  status: checks.some((item) => item.status.startsWith("blocked")) ? "release_candidate_local_with_blockers" : "release_candidate_local",
  checks,
  summary: {
    readyLocal: checks.filter((item) => item.status === "ready_local").length,
    blocked: checks.filter((item) => item.status.startsWith("blocked")).length,
    reviewRequired: checks.filter((item) => item.status === "review_required").length,
  },
};

const artifactPath = path.join(artifactDir, `release-candidate-local-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(payload, null, 2));
writeDoc(payload, artifactPath);
console.log(`Release candidate local: ${payload.status}. Artifact: ${artifactPath}`);

function row(area, status, evidence, risk) {
  return { area, status, evidence, risk };
}

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

function latestJson(relativeDir, pattern) {
  const artifact = latestArtifact(relativeDir, pattern);
  if (artifact === "Sin artifact local") return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, artifact), "utf8"));
  } catch {
    return null;
  }
}

function latestUiStatus() {
  const payload = latestJson("artifacts/ui-audit", /^ui-actions-/);
  return payload?.status === "passed" ? "ready_local" : "review_required";
}

function latestPermissionStatus() {
  const payload = latestJson("artifacts/security", /^permission-gates-/);
  return payload?.summary?.critical === 0 && payload?.summary?.requiresReview === 0 ? "ready_local" : "review_required";
}

function latestDemoStatus() {
  const payload = latestJson("artifacts/security", /^demo-usage-/);
  return payload?.summary?.prohibited === 0 && payload?.summary?.doubtful === 0 ? "ready_local" : "review_required";
}

function envPresent(name) {
  return Boolean(process.env[name]);
}

function e2eReady() {
  return envPresent("E2E_EMAIL") && envPresent("E2E_PASSWORD");
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
    .map((item) => `| ${item.area} | ${item.status} | \`${item.evidence}\` | ${item.risk} |`)
    .join("\n");

  fs.writeFileSync(
    path.join(docsDir, "release-candidate-local.md"),
    `# Release candidate local Nutri

Generado: ${payload.generatedAt}

- Estado: ${payload.status}
- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`
- Regla: RC local no cierra bloqueos que requieren credenciales, usuarios Auth, evidencia autenticada o CSV oficiales.

## Comandos ejecutables

\`\`\`bash
npm run verify:pilot
npm run smoke:routes
npm run audit:ui
npm run visual:parity
npm run check:env
npm run unblock:steps
\`\`\`

## Matriz RC

| Area | Estado | Evidencia | Riesgo |
|---|---|---|---|
${rows}

## Criterio para pasar a piloto real

- QA Seguridad P0 cerrado con usuarios reales.
- E2E Enteral autenticado cerrado desde UI.
- Edge Function \`admin-invite-user\` desplegada y validada si se usara para usuarios.
- \`report.exported\` visible en \`/app/audit\`.
- Pediatria WHO completa solo con CSV oficiales cargados.

## Criterio para no pasar a piloto real

- Cualquier fuga cross-tenant.
- Cualquier secreto en frontend o archivos versionados.
- Pantallas principales con ErrorBoundary en carga normal.
- Botones clinicos o administrativos falsos sin estado limitado.
`,
  );
}
