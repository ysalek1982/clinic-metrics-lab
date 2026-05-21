import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactDir = path.join(repoRoot, "artifacts", "qa");

const requiredEnv = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "QA_NO_MEMBERSHIP_EMAIL",
  "QA_NO_MEMBERSHIP_PASSWORD",
  "QA_HSM_EMAIL",
  "QA_HSM_PASSWORD",
  "QA_TENANT_B_EMAIL",
  "QA_TENANT_B_PASSWORD",
  "QA_TENANT_B_ID",
];

const expectedUsers = [
  { key: "noMembership", emailEnv: "QA_NO_MEMBERSHIP_EMAIL", passwordEnv: "QA_NO_MEMBERSHIP_PASSWORD", expected: "Auth confirmado sin membership activo" },
  { key: "hsmClinical", emailEnv: "QA_HSM_EMAIL", passwordEnv: "QA_HSM_PASSWORD", expected: "Clinico HSM no-superadmin" },
  { key: "tenantBClinical", emailEnv: "QA_TENANT_B_EMAIL", passwordEnv: "QA_TENANT_B_PASSWORD", expected: "Clinico tenant B no-superadmin" },
];

const expectedTenants = [
  { key: "HSM", tenantId: "11111111-1111-4111-8111-111111111111", source: "constante validada" },
  { key: "Tenant B", tenantIdEnv: "QA_TENANT_B_ID", source: "variable de entorno" },
];

const targetTables = [
  "patients",
  "encounters",
  "clinical_assessments",
  "clinical_notes",
  "nutrition_plans",
  "lab_orders",
  "lab_results",
  "alert_acknowledgements",
  "appointments",
  "message_threads",
  "messages",
  "message_read_receipts",
  "recipes",
  "recipe_ingredients",
  "weekly_menus",
  "weekly_menu_items",
  "food_items",
  "report_runs",
  "pediatric_growth_records",
  "pediatric_growth_results",
  "enteral_plans",
  "enteral_daily_logs",
  "parenteral_plans",
  "parenteral_monitoring_logs",
  "sports_profiles",
  "sports_bodycomp_snapshots",
  "audit_logs",
  "tenant_memberships",
  "membership_roles",
];

const generatedAt = new Date().toISOString();
const env = Object.fromEntries(requiredEnv.map((name) => [name, hasEnv(name)]));
const missing = requiredEnv.filter((name) => !env[name]);
const ready = missing.length === 0;

const plan = [
  "Crear clientes Supabase normales con publishable key.",
  "Iniciar sesion como usuario sin membership, HSM y Tenant B.",
  "Consultar matriz anon, sin membership, HSM y Tenant B.",
  "Forzar filtros tenant-cross HSM -> B y B -> HSM.",
  "Validar audit_logs, tenant_memberships y tablas clinicas tenant-scoped.",
  "Generar artifact JSON sin imprimir credenciales.",
];

const artifact = {
  generatedAt,
  dryRun: true,
  ready,
  missing,
  env,
  expectedUsers: expectedUsers.map((user) => ({
    key: user.key,
    emailPresent: hasEnv(user.emailEnv),
    passwordPresent: hasEnv(user.passwordEnv),
    expected: user.expected,
  })),
  expectedTenants: expectedTenants.map((tenant) => ({
    key: tenant.key,
    present: tenant.tenantId ? true : hasEnv(tenant.tenantIdEnv),
    source: tenant.source,
  })),
  targetTables,
  commandWouldRun: "node scripts/qa-security-p0.mjs",
  expectedArtifacts: ["artifacts/security/qa-p0-<timestamp>.json"],
  plan,
  safeNotes: [
    "Dry-run no conecta si faltan variables.",
    "Dry-run no imprime emails/passwords completos.",
    "QA P0 no queda cerrado hasta ejecutar usuarios reales confirmados.",
  ],
};

fs.mkdirSync(artifactDir, { recursive: true });
const artifactPath = path.join(artifactDir, `qa-security-p0-dry-run-${stamp(generatedAt)}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), "utf8");

console.log("QA Seguridad P0 dry-run");
console.log("No se imprimen valores sensibles.");
console.log(`Estado: ${ready ? "precondiciones listas" : "bloqueado por variables faltantes"}`);
if (!ready) console.log(`Faltan: ${missing.join(", ")}`);
console.log(`Tablas objetivo: ${targetTables.length}`);
console.log("Comando real cuando este listo: node scripts/qa-security-p0.mjs");
console.log(`Artifact: ${artifactPath}`);

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function stamp(value) {
  return value.replace(/[:.]/g, "-");
}
