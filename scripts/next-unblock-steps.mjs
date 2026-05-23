import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
loadEnvFile(path.join(repoRoot, ".env.local"));

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function allEnv(names) {
  return names.every(hasEnv);
}

const checks = [
  {
    title: "Desplegar Edge Function admin-invite-user",
    ready: hasEnv("SUPABASE_ACCESS_TOKEN"),
    missing: ["SUPABASE_ACCESS_TOKEN"].filter((name) => !hasEnv(name)),
    command: "npx supabase functions deploy admin-invite-user --project-ref nxqnmfvftwrvkjfahmmz",
  },
  {
    title: "Aplicar migraciones pendientes",
    ready: hasEnv("SUPABASE_DB_PASSWORD"),
    missing: ["SUPABASE_DB_PASSWORD"].filter((name) => !hasEnv(name)),
    command:
      '$dbUrl = "postgresql://postgres.nxqnmfvftwrvkjfahmmz:$env:SUPABASE_DB_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"; npx supabase db push --include-all --db-url $dbUrl',
  },
  {
    title: "Ejecutar E2E Enteral",
    ready: allEnv(["E2E_EMAIL", "E2E_PASSWORD"]) || hasPassedResult(path.join(repoRoot, "artifacts", "e2e", "enteral-f9i", "result.json")),
    missing: ["E2E_EMAIL", "E2E_PASSWORD"].filter((name) => !hasEnv(name)),
    command: "npm run e2e:enteral",
  },
  {
    title: "Ejecutar QA Seguridad P0",
    ready: allEnv([
      "QA_NO_MEMBERSHIP_EMAIL",
      "QA_NO_MEMBERSHIP_PASSWORD",
      "QA_HSM_EMAIL",
      "QA_HSM_PASSWORD",
      "QA_TENANT_B_EMAIL",
      "QA_TENANT_B_PASSWORD",
      "QA_TENANT_B_ID",
    ]) || hasPassedResult(latestArtifact("artifacts/authenticated-functional", /^authenticated-functional-/)),
    missing: [
      "QA_NO_MEMBERSHIP_EMAIL",
      "QA_NO_MEMBERSHIP_PASSWORD",
      "QA_HSM_EMAIL",
      "QA_HSM_PASSWORD",
      "QA_TENANT_B_EMAIL",
      "QA_TENANT_B_PASSWORD",
      "QA_TENANT_B_ID",
    ].filter((name) => !hasEnv(name)),
    command: "npm run qa:security-p0",
  },
  {
    title: "Confirmar report.exported en /app/audit",
    ready: allEnv(["E2E_EMAIL", "E2E_PASSWORD"]) || reportExportEvidenceReady(),
    missing: ["E2E_EMAIL", "E2E_PASSWORD"].filter((name) => !hasEnv(name)),
    command: "npm run e2e:report-export",
  },
];

console.log("Nutri proximos desbloqueos");
console.log("No se imprimen valores sensibles.\n");

console.log("LISTO LOCALMENTE:");
console.log("- smoke local");
console.log("- build/lint/tests");
console.log("- visual parity script");
console.log("- auditoria UI local");
console.log("- docs de piloto");

console.log("\nBLOQUEADO POR CREDENCIAL:");
for (const check of checks) {
  console.log(`- ${check.title}: ${check.ready ? "listo para ejecutar" : `bloqueado por ${check.missing.join(", ")}`}`);
  if (check.ready) console.log(`  Comando: ${check.command}`);
}

console.log("\nBLOQUEADO POR INSUMO CLINICO:");
console.log("- Pediatria WHO/OMS: agregar CSV oficiales normalizados antes de importar referencias.");

function reportExportEvidenceReady() {
  const payload = readJson(path.join(repoRoot, "artifacts", "e2e", "reports-export", "result.json"));
  return Boolean(payload?.blockedReason === null && Array.isArray(payload?.auditEvents?.["report.exported"]) && payload.auditEvents["report.exported"].length >= 2);
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

function hasPassedResult(filePath) {
  const payload = readJson(filePath);
  return Boolean(payload && (payload.status === "passed" || payload.blockedReason === null));
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
