import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactDir = path.join(root, "artifacts", "qa");
fs.mkdirSync(artifactDir, { recursive: true });

const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function addCheck(id, passed, evidence, risk = "none") {
  checks.push({ id, passed, evidence, risk });
}

const migration = [
  read("supabase/migrations/20260521165000_saas_subscription_plans_and_time_limited_courtesies.sql"),
  read("supabase/migrations/20260521172000_commercial_saas_free_pro_clinic_hospital.sql"),
].join("\n");
const service = read("src/services/subscriptionService.ts");
const saasAdminPage = read("src/pages/app/SaasAdmin.tsx");
const subscriptionAccess = read("src/lib/subscriptionAccess.ts");
const billingProvider = read("src/lib/billingProvider.ts");
const packageJson = JSON.parse(read("package.json"));

for (const planCode of ["free", "courtesy", "pro", "clinic_hospital"]) {
  addCheck(`plan-${planCode}`, migration.includes(`'${planCode}'`), `Plan ${planCode} definido en migracion.`);
}

addCheck("plan-entitlements-table", migration.includes("create table if not exists public.plan_entitlements"), "Tabla plan_entitlements definida.");
addCheck("tenant-subscriptions-extended", migration.includes("courtesy_ends_at") && migration.includes("payment_provider"), "tenant_subscriptions extiende cortesias y proveedor futuro.");
addCheck("subscription-events-table", migration.includes("create table if not exists public.subscription_events"), "subscription_events definido.");
addCheck("rls-enabled", migration.includes("enable row level security") && migration.includes("public.is_platform_superadmin()"), "RLS y platform admin presentes.");
addCheck("admin-rpcs", migration.includes("admin_assign_tenant_plan") && migration.includes("admin_grant_courtesy_subscription"), "RPCs admin de suscripcion presentes.");
addCheck("approval-assigns-subscription", migration.includes("subscription.granted") && migration.includes("admin_approve_access_request"), "Aprobacion crea/actualiza suscripcion.");
addCheck("free-default-rpc", migration.includes("ensure_free_subscription_for_current_user"), "RPC de alta free idempotente presente.");
addCheck("commercial-plans", migration.includes("Clinic/Hospital") && migration.includes("'pro'"), "Modelo comercial Free/Pro/Clinic-Hospital presente.");
addCheck("subscription-access-tests", fs.existsSync(path.join(root, "src/lib/subscriptionAccess.test.ts")), "Tests de subscriptionAccess existen.");
addCheck("plan-gate", fs.existsSync(path.join(root, "src/components/common/PlanGate.tsx")), "PlanGate existe.");
addCheck("saas-admin-tabs", saasAdminPage.includes('TabsTrigger value="plans"') && saasAdminPage.includes('TabsTrigger value="subscriptions"'), "/app/saas-admin incluye planes y suscripciones.");
addCheck("service-no-service-role", !/service_role|SUPABASE_SERVICE_ROLE/i.test(service), "subscriptionService no contiene service_role.");
addCheck("frontend-no-service-role", !/service_role|SUPABASE_SERVICE_ROLE/i.test(saasAdminPage + subscriptionAccess), "UI y helpers SaaS no contienen service_role.");
addCheck("billing-disabled", billingProvider.includes('provider: "none"') && billingProvider.includes("No se ejecutan cobros"), "Billing provider queda deshabilitado.");
addCheck("package-script", packageJson.scripts?.["qa:saas-subscriptions"] === "node scripts/qa-saas-subscriptions.mjs", "Script qa:saas-subscriptions registrado.");

const failed = checks.filter((check) => !check.passed);
const artifact = {
  generatedAt: new Date().toISOString(),
  checks,
  summary: {
    total: checks.length,
    failed: failed.length,
  },
};

const artifactPath = path.join(artifactDir, `saas-subscriptions-${timestamp}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));

console.log(`SaaS subscriptions QA artifact: ${path.relative(root, artifactPath)}`);

if (failed.length > 0) {
  for (const failure of failed) {
    console.error(`FAIL ${failure.id}: ${failure.evidence}`);
  }
  process.exit(1);
}

console.log("SaaS subscriptions QA passed.");
