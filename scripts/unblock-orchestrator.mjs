import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = path.join(repoRoot, "artifacts", "readiness");

const required = {
  edgeFunctionDeploy: ["SUPABASE_ACCESS_TOKEN"],
  dbPush: ["SUPABASE_DB_PASSWORD"],
  enteralE2e: ["E2E_EMAIL", "E2E_PASSWORD"],
  qaSecurityP0: [
    "QA_NO_MEMBERSHIP_EMAIL",
    "QA_NO_MEMBERSHIP_PASSWORD",
    "QA_HSM_EMAIL",
    "QA_HSM_PASSWORD",
    "QA_TENANT_B_EMAIL",
    "QA_TENANT_B_PASSWORD",
    "QA_TENANT_B_ID",
  ],
  qaE2eUser: ["QA_E2E_EMAIL", "QA_E2E_PASSWORD"],
};

const commands = {
  localVerify: "npm run verify:pilot",
  edgeFunctionDeploy: "npx supabase functions deploy admin-invite-user --project-ref nxqnmfvftwrvkjfahmmz",
  qaSecurityP0DryRun: "node scripts/qa-security-p0-dry-run.mjs",
  qaSecurityP0: "node scripts/qa-security-p0.mjs",
  enteralE2eDryRun: "node scripts/e2e-enteral-dry-run.mjs",
  enteralE2e: "node scripts/e2e-enteral-flow.mjs",
  reportExportEvidence: "Con sesion autenticada: exportar PDF/XLSX en /app/reports y verificar report.exported en /app/audit.",
};

const envNames = [...new Set(Object.values(required).flat())];
const envState = Object.fromEntries(envNames.map((name) => [name, hasEnv(name)]));

const checks = Object.entries(required).map(([key, names]) => ({
  key,
  ready: names.every((name) => envState[name]),
  missing: names.filter((name) => !envState[name]),
}));

const plan = [
  {
    step: 1,
    title: "Verificar estado local",
    ready: true,
    command: commands.localVerify,
    expectedEvidence: "Build, lint, tests y smoke locales pasan.",
  },
  {
    step: 2,
    title: "Desplegar Edge Function admin-invite-user",
    ready: isReady("edgeFunctionDeploy"),
    missing: missingFor("edgeFunctionDeploy"),
    command: commands.edgeFunctionDeploy,
    expectedEvidence: "Funcion desplegada y disponible para invitar usuarios sin service role en frontend.",
  },
  {
    step: 3,
    title: "Preparar usuarios QA",
    ready: isReady("edgeFunctionDeploy") || isReady("qaSecurityP0"),
    missing: [...new Set([...missingFor("edgeFunctionDeploy"), ...missingFor("qaSecurityP0")])],
    command: "Abrir /app/users y crear/invitar/asignar usuarios QA segun runbook.",
    expectedEvidence: "Usuarios Auth confirmados y memberships/audit logs visibles.",
  },
  {
    step: 4,
    title: "Ejecutar QA Seguridad P0",
    ready: isReady("qaSecurityP0"),
    missing: missingFor("qaSecurityP0"),
    command: commands.qaSecurityP0,
    expectedEvidence: "Artifact de QA P0 con anon, sin membership y tenant-cross validados.",
  },
  {
    step: 5,
    title: "Ejecutar E2E Enteral",
    ready: isReady("enteralE2e") || isReady("qaE2eUser"),
    missing: e2eMissingAlternatives(),
    command: commands.enteralE2e,
    expectedEvidence: "Plan/log/pausa/cierre desde UI, screenshots y audit logs.",
  },
  {
    step: 6,
    title: "Confirmar report.exported",
    ready: isReady("enteralE2e") || isReady("qaE2eUser"),
    missing: e2eMissingAlternatives(),
    command: commands.reportExportEvidence,
    expectedEvidence: "report.exported visible en /app/audit con formato y report_type.",
  },
];

const forbidden = [
  "No ejecutar db push sin revision humana y SUPABASE_DB_PASSWORD.",
  "No desplegar Edge Functions sin SUPABASE_ACCESS_TOKEN.",
  "No ejecutar E2E autenticado sin E2E_EMAIL/E2E_PASSWORD o QA_E2E_EMAIL/QA_E2E_PASSWORD.",
  "No imprimir valores de tokens, passwords ni storageState.",
  "No cerrar QA P0, E2E Enteral, report.exported ni Edge Function deploy sin evidencia real.",
];

fs.mkdirSync(artifactDir, { recursive: true });
const generatedAt = new Date().toISOString();
const artifactPath = path.join(artifactDir, `unblock-orchestrator-${stamp(generatedAt)}.json`);
fs.writeFileSync(
  artifactPath,
  JSON.stringify({ generatedAt, envState, checks, plan, forbidden }, null, 2),
  "utf8",
);

console.log("Nutri unblock orchestrator");
console.log("No se imprimen valores sensibles.\n");
console.log("LISTO:");
console.log("- Validaciones locales y scripts dry-run.");
console.log("- Runbook de desbloqueo sin secretos.");
console.log("\nFALTA:");
for (const check of checks) {
  console.log(`- ${check.key}: ${check.ready ? "listo" : `faltan ${check.missing.join(", ")}`}`);
}
console.log("\nPLAN:");
for (const item of plan) {
  console.log(`${item.step}. ${item.title}: ${item.ready ? "listo" : `bloqueado por ${item.missing.join(", ")}`}`);
  console.log(`   Comando: ${item.command}`);
  console.log(`   Evidencia esperada: ${item.expectedEvidence}`);
}
console.log("\nNO EJECUTAR:");
for (const item of forbidden) console.log(`- ${item}`);
console.log(`\nArtifact: ${artifactPath}`);

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function isReady(key) {
  return checks.find((check) => check.key === key)?.ready ?? false;
}

function missingFor(key) {
  return checks.find((check) => check.key === key)?.missing ?? [];
}

function e2eMissingAlternatives() {
  if (isReady("enteralE2e") || isReady("qaE2eUser")) return [];
  return ["E2E_EMAIL/E2E_PASSWORD", "o", "QA_E2E_EMAIL/QA_E2E_PASSWORD"];
}

function stamp(value) {
  return value.replace(/[:.]/g, "-");
}
