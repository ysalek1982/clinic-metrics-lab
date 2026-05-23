import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactDir = path.join(root, "artifacts", "qa");
const artifactPath = path.join(artifactDir, `saas-admin-${timestamp}.json`);

const checks = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
}

function addCheck(name, passed, evidence, risk = "low") {
  checks.push({ name, passed, evidence, risk });
}

const migrationPath = "supabase/migrations/20260521153000_saas_admin_approvals_and_courtesy_memberships.sql";
const migration = read(migrationPath);
const service = read("src/services/saasAdminService.ts");
const hook = read("src/hooks/useSaasAdmin.ts");
const page = read("src/pages/app/SaasAdmin.tsx");
const app = read("src/App.tsx");
const registry = read("src/config/moduleRegistry.ts");
const activate = read("src/pages/ActivateInvite.tsx");
const packageJson = read("package.json");

addCheck("migration_exists", Boolean(migration), migrationPath);
addCheck("access_requests_table", /create table if not exists public\.access_requests/.test(migration), "access_requests defined");
addCheck("courtesy_grants_table", /create table if not exists public\.tenant_membership_grants/.test(migration), "tenant_membership_grants defined");
addCheck("rls_enabled", /alter table public\.access_requests enable row level security/.test(migration), "RLS enabled");
addCheck("approve_rpc", /admin_approve_access_request/.test(migration), "approval RPC present");
addCheck("reject_rpc", /admin_reject_access_request/.test(migration), "rejection RPC present");
addCheck("invite_rpc", /admin_create_invite_code/.test(migration), "invite RPC present");
addCheck("ysalek_no_password", /ysalek@gmail\.com/.test(migration) && !/password|crypt\(|encrypted_password/i.test(migration), "ysalek handled without password");
addCheck("service_no_service_role", !/service_role|SUPABASE_SERVICE_ROLE/i.test(service + hook + page), "no service role in frontend SaaS admin");
addCheck("service_uses_rpc", /admin_approve_access_request/.test(service), "service calls RPCs");
addCheck("users_tab_real_list", /admin_list_memberships/.test(service) && /Directorio SaaS protegido/.test(page), "Usuarios tab lists real memberships");
addCheck("effective_permissions_drawer", /admin_list_effective_permissions/.test(service) && /Permisos efectivos/.test(page), "effective permissions available in user drawer");
addCheck("role_management_rpc", /admin_assign_role_to_user/.test(service) && /admin_remove_role_from_user/.test(service), "role assignment/removal uses RPC");
addCheck("membership_status_rpc", /admin_update_membership_status/.test(service), "membership status updates use RPC");
addCheck("route_exists", /path=\"saas-admin\"/.test(app), "/app/saas-admin route");
addCheck("registry_exists", /id: \"saas-admin\"/.test(registry), "moduleRegistry entry");
addCheck("activate_request_flow", /submitAccessRequest/.test(activate) && /Solicitar acceso/.test(activate), "ActivateInvite request flow");
addCheck("package_script", /\"qa:saas-admin\"/.test(packageJson), "package script registered");

const failed = checks.filter((check) => !check.passed);
const result = {
  ok: failed.length === 0,
  generatedAt: new Date().toISOString(),
  checks,
  failed,
  notes: [
    "Static QA only. It does not create Auth users, apply migrations, or print secrets.",
    "Remote RLS validation requires applying the migration in Supabase with authorization.",
  ],
};

fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(result, null, 2));

console.log(`SaaS Admin QA artifact: ${path.relative(root, artifactPath)}`);
if (failed.length > 0) {
  console.error(`SaaS Admin QA failed: ${failed.map((check) => check.name).join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("SaaS Admin QA passed.");
}
