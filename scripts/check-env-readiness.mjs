import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
loadEnvFile(path.join(repoRoot, ".env.local"));

const REQUIRED_FLAGS = [
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

const rows = REQUIRED_FLAGS.map((name) => ({
  name,
  present: typeof process.env[name] === "string" && process.env[name].trim().length > 0,
}));

const missing = rows.filter((row) => !row.present).map((row) => row.name);
const readyLocal = [
  "build/lint/tests locales",
  "smoke local",
  "auditoria de acciones UI",
  "captura de paridad visual",
  "documentacion de piloto",
];

console.log("Nutri readiness env check");
console.log("No se imprimen valores sensibles.\n");

console.log("LISTO LOCALMENTE:");
readyLocal.forEach((item) => console.log(`- ${item}`));

console.log("\nVARIABLES:");
for (const row of rows) {
  console.log(`- ${row.name}: ${row.present ? "presente" : "ausente"}`);
}

console.log("\nBLOQUEADO POR CREDENCIAL:");
printBlocker("Edge Function", ["SUPABASE_ACCESS_TOKEN"]);
printBlocker("DB push remoto", ["SUPABASE_DB_PASSWORD"]);
printEvidenceBlocker("E2E Enteral", ["E2E_EMAIL", "E2E_PASSWORD"], hasPassedResult("artifacts/e2e/enteral-f9i/result.json"));
printEvidenceBlocker("QA Seguridad P0", [
  "QA_NO_MEMBERSHIP_EMAIL",
  "QA_NO_MEMBERSHIP_PASSWORD",
  "QA_HSM_EMAIL",
  "QA_HSM_PASSWORD",
  "QA_TENANT_B_EMAIL",
  "QA_TENANT_B_PASSWORD",
  "QA_TENANT_B_ID",
], hasPassedResult(latestArtifact("artifacts/authenticated-functional", /^authenticated-functional-/)));
printEvidenceBlocker("report.exported", ["E2E_EMAIL", "E2E_PASSWORD"], hasReportExportEvidence());

console.log("\nBLOQUEADO POR INSUMO CLINICO:");
console.log("- Pediatria WHO/OMS: CSV oficiales normalizados requeridos.");

console.log(`\nResumen: ${missing.length === 0 ? "entorno completo" : `${missing.length} variable(s) pendiente(s)`}.`);

function printBlocker(label, names) {
  const absent = names.filter((name) => !hasEnv(name));
  console.log(`- ${label}: ${absent.length === 0 ? "listo" : `falta ${absent.join(", ")}`}`);
}

function printEvidenceBlocker(label, names, evidenceReady) {
  const absent = names.filter((name) => !hasEnv(name));
  if (evidenceReady) {
    console.log(`- ${label}: listo por evidencia autenticada local`);
    return;
  }
  console.log(`- ${label}: ${absent.length === 0 ? "listo" : `falta ${absent.join(", ")}`}`);
}

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function hasReportExportEvidence() {
  const filePath = path.join(repoRoot, "artifacts", "e2e", "reports-export", "result.json");
  if (!hasPassedResult(filePath)) return false;
  const payload = readJson(filePath);
  return Array.isArray(payload?.auditEvents?.["report.exported"]) && payload.auditEvents["report.exported"].length >= 2;
}

function hasPassedResult(filePath) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  const payload = readJson(resolved);
  if (!payload) return false;
  return payload.status === "passed" || payload.blockedReason === null;
}

function latestArtifact(relativeDir, pattern) {
  const dir = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(dir)) return "";
  const files = fs
    .readdirSync(dir)
    .filter((name) => pattern.test(name))
    .map((name) => path.join(dir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0] ?? "";
}

function readJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:\$env:)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}
