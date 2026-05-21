import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "readiness");

const envChecks = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "E2E_EMAIL",
  "E2E_PASSWORD",
  "QA_TENANT_B_ID",
  "QA_NO_MEMBERSHIP_EMAIL",
  "QA_NO_MEMBERSHIP_PASSWORD",
  "QA_HSM_EMAIL",
  "QA_HSM_PASSWORD",
  "QA_TENANT_B_EMAIL",
  "QA_TENANT_B_PASSWORD",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

const localReady = [
  "build/lint/tests locales",
  "smoke de rutas locales",
  "captura de paridad visual",
  "auditoria de acciones UI",
  "documentacion de piloto",
];
const env = Object.fromEntries(envChecks.map((name) => [name, hasEnv(name) ? "present" : "missing"]));
const blockers = {
  edgeFunctionDeploy: hasEnv("SUPABASE_ACCESS_TOKEN") ? "ready" : "blocked: SUPABASE_ACCESS_TOKEN missing",
  dbPush: hasEnv("SUPABASE_DB_PASSWORD") ? "ready" : "blocked: SUPABASE_DB_PASSWORD missing",
  qaUsers: qaUsersReady() ? "ready" : "blocked: QA Auth users/credentials missing",
  enteralE2e: hasEnv("E2E_EMAIL") && hasEnv("E2E_PASSWORD") ? "ready" : "blocked: E2E_EMAIL/E2E_PASSWORD missing",
  reportExportAudit: hasEnv("E2E_EMAIL") && hasEnv("E2E_PASSWORD") ? "ready" : "blocked: authenticated audit evidence missing",
  pediatricWho: hasOfficialWhoFiles() ? "ready: candidate reference files found" : "blocked: official WHO/OMS CSV files missing",
};
const smoke = await runSmoke();
const recommendations = buildRecommendations(blockers);

const result = {
  generatedAt: new Date().toISOString(),
  localReady,
  env,
  blockers,
  smoke,
  recommendations,
};

fs.mkdirSync(artifactDir, { recursive: true });
const artifactPath = path.join(artifactDir, `pilot-readiness-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(result, null, 2));

console.log("Nutri pilot readiness");
console.log("No se imprimen valores sensibles.\n");
console.log("LISTO LOCALMENTE:");
localReady.forEach((item) => console.log(`- ${item}`));
console.log("\nBLOQUEOS:");
Object.entries(blockers).forEach(([key, value]) => console.log(`- ${key}: ${value}`));
console.log(`\nsmokeLocal: ${smoke.status}`);
console.log(`artifact: ${artifactPath}`);

if (smoke.status === "failed") {
  process.exitCode = 1;
}

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function qaUsersReady() {
  return [
    "QA_TENANT_B_ID",
    "QA_NO_MEMBERSHIP_EMAIL",
    "QA_NO_MEMBERSHIP_PASSWORD",
    "QA_HSM_EMAIL",
    "QA_HSM_PASSWORD",
    "QA_TENANT_B_EMAIL",
    "QA_TENANT_B_PASSWORD",
  ].every(hasEnv);
}

function hasOfficialWhoFiles() {
  const candidates = [path.join(repoRoot, "data"), path.join(repoRoot, "docs", "references")];
  return candidates.some((dir) => {
    if (!fs.existsSync(dir)) return false;
    return fs
      .readdirSync(dir, { recursive: true })
      .some((entry) => /who|oms/i.test(String(entry)) && /\.(csv|xlsx|xls)$/i.test(String(entry)));
  });
}

function buildRecommendations(currentBlockers) {
  const items = [];
  if (currentBlockers.edgeFunctionDeploy.startsWith("blocked")) {
    items.push("Definir SUPABASE_ACCESS_TOKEN y desplegar admin-invite-user.");
  }
  if (currentBlockers.qaUsers.startsWith("blocked")) {
    items.push("Crear usuarios Auth QA reales y definir credenciales QA_* para cerrar QA Seguridad P0.");
  }
  if (currentBlockers.enteralE2e.startsWith("blocked")) {
    items.push("Definir E2E_EMAIL/E2E_PASSWORD o SMOKE_STORAGE_STATE autenticado para E2E Enteral.");
  }
  if (currentBlockers.reportExportAudit.startsWith("blocked")) {
    items.push("Usar sesion autenticada para exportar reportes y confirmar report.exported en /app/audit.");
  }
  if (currentBlockers.pediatricWho.startsWith("blocked")) {
    items.push("Agregar CSV oficiales WHO/OMS normalizados antes de habilitar z-score/percentil real.");
  }
  if (items.length === 0) items.push("Ejecutar los cierres remotos pendientes en el orden documentado.");
  return items;
}

function runSmoke() {
  return new Promise((resolve) => {
    const nodeCommand = process.execPath;
    const child = spawn(nodeCommand, ["scripts/smoke-routes-local.mjs"], {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let output = "";
    let errorOutput = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({
        status: code === 0 ? "passed" : "failed",
        exitCode: code,
        summary: sanitizeOutput(output || errorOutput),
      });
    });
  });
}

function sanitizeOutput(value) {
  return value
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !/password|token|secret/i.test(line))
    .slice(-8);
}
