import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const envFile = path.join(repoRoot, ".env.local");
const authDir = path.join(repoRoot, "playwright", ".auth");
const artifactDir = path.join(repoRoot, "artifacts", "authenticated-functional");

loadEnvFile(envFile);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.QA_REMOTE_URL || process.env.AUTH_BASE_URL || "https://clinic-metrics-lab.vercel.app";

const requiredEnv = {
  VITE_SUPABASE_URL: Boolean(supabaseUrl),
  VITE_SUPABASE_PUBLISHABLE_KEY: Boolean(anonKey),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceRoleKey),
};

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  writeArtifact({
    status: "blocked",
    generatedAt: new Date().toISOString(),
    requiredEnv,
    reason: "Faltan variables necesarias para QA autenticado server-side.",
  });
  console.log("QA autenticado funcional: blocked. No se imprimen secretos.");
  process.exit(0);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const authStorageKey = `sb-${projectRef}-auth-token`;

const personas = [
  {
    key: "ysalek",
    email: process.env.YSALEK_EMAIL || "ysalek@gmail.com",
    roleCode: "platform_superadmin",
    planCode: "clinic_hospital",
    tenantSlug: "platform-admin",
    tenantName: "Nutri Platform Admin",
    tenantType: "platform",
    storageFile: "ysalek.json",
    expect: {
      allowed: ["/app", "/app/saas-admin", "/app/users", "/app/modules", "/app/audit"],
      blocked: [],
    },
  },
  {
    key: "marcela-free",
    email: process.env.MARCELA_EMAIL || "marcelacruz2000@gmail.com",
    roleCode: "free_member",
    planCode: "free",
    tenantSlug: "marcela-free",
    tenantName: "Mi espacio Marcela",
    tenantType: "personal",
    storageFile: "marcela-free.json",
    expect: {
      allowed: ["/app", "/app/account", "/app/modules", "/app/patients"],
      blocked: ["/app/copilot", "/app/organization", "/app/users", "/app/audit", "/app/saas-admin", "/app/reports", "/app/pack/enteral/cockpit", "/app/pack/parenteral"],
    },
  },
  {
    key: "qa-pro",
    email: process.env.QA_PRO_EMAIL || "qa-pro@nutri.test",
    roleCode: "clinical_nutritionist",
    planCode: "pro",
    tenantSlug: "qa-m49-pro",
    tenantName: "qa_m49_pro personal",
    tenantType: "personal",
    storageFile: "qa-pro.json",
    expect: {
      allowed: ["/app", "/app/account", "/app/modules", "/app/reports", "/app/copilot", "/app/labs", "/app/recipes", "/app/weekly-menu"],
      blocked: ["/app/saas-admin", "/app/organization"],
    },
  },
  {
    key: "qa-clinic",
    email: process.env.QA_CLINIC_EMAIL || "qa-clinic@nutri.test",
    roleCode: "tenant_owner",
    planCode: "clinic_hospital",
    tenantSlug: "qa-m49-clinic",
    tenantName: "qa_m49_clinic hospital",
    tenantType: "clinic",
    storageFile: "qa-clinic.json",
    expect: {
      allowed: ["/app", "/app/account", "/app/modules", "/app/organization", "/app/users", "/app/audit", "/app/reports", "/app/pack/enteral/cockpit"],
      blocked: ["/app/saas-admin"],
    },
  },
  {
    key: "qa-courtesy",
    email: process.env.QA_COURTESY_EMAIL || "qa-courtesy@nutri.test",
    roleCode: "clinical_nutritionist",
    planCode: "courtesy",
    tenantSlug: "qa-m49-courtesy",
    tenantName: "qa_m49_courtesy personal",
    tenantType: "personal",
    storageFile: "qa-courtesy.json",
    courtesyDays: 30,
    expect: {
      allowed: ["/app", "/app/account", "/app/modules", "/app/reports", "/app/copilot", "/app/labs"],
      blocked: ["/app/saas-admin", "/app/organization"],
    },
  },
  {
    key: "qa-no-membership",
    email: process.env.QA_NO_MEMBERSHIP_EMAIL || "qa-no-membership@nutri.test",
    noMembership: true,
    storageFile: "qa-no-membership.json",
    expect: {
      allowed: ["/activate-invite"],
      blocked: ["/app"],
    },
  },
];

const setupResults = [];
const routeResults = [];

fs.mkdirSync(authDir, { recursive: true });

for (const persona of personas) {
  const setup = await setupPersona(persona);
  setupResults.push(setup);
  if (setup.status !== "ready") continue;
  const stateResult = await createStorageState(persona, setup);
  setup.storageState = stateResult.status;
  setup.storageFile = stateResult.relativePath;
}

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  writeArtifact({
    status: "blocked",
    generatedAt: new Date().toISOString(),
    requiredEnv,
    setupResults,
    routeResults,
    reason: `Playwright no disponible: ${messageOf(error)}`,
  });
  console.log("QA autenticado funcional: blocked by playwright. No se imprimen secretos.");
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
for (const persona of personas) {
  const statePath = path.join(authDir, persona.storageFile);
  if (!fs.existsSync(statePath)) {
    routeResults.push({
      persona: persona.key,
      status: "blocked",
      reason: "storage_state_missing",
    });
    continue;
  }
  const context = await browser.newContext({ storageState: statePath, viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  for (const route of persona.expect.allowed) {
    routeResults.push(await checkRoute(page, persona.key, route, "allowed"));
  }
  for (const route of persona.expect.blocked) {
    routeResults.push(await checkRoute(page, persona.key, route, "blocked"));
  }
  await context.close();
}
await browser.close();

const failedRoutes = routeResults.filter((result) => result.status === "failed");
const payload = {
  status: failedRoutes.length === 0 ? "passed" : "failed",
  generatedAt: new Date().toISOString(),
  baseUrl,
  requiredEnv,
  setupResults,
  routeResults,
  summary: {
    personas: personas.length,
    routeChecks: routeResults.length,
    failed: failedRoutes.length,
  },
};

const artifactPath = writeArtifact(payload);
console.log(`QA autenticado funcional: ${payload.status}. Artifact: ${artifactPath}`);
if (failedRoutes.length > 0) process.exitCode = 1;

async function setupPersona(persona) {
  const user = await ensureAuthUser(persona.email);
  if (!user?.id) return { persona: persona.key, status: "blocked", reason: "auth_user_missing" };

  if (persona.noMembership) {
    await removeMemberships(user.id);
    return { persona: persona.key, status: "ready", userId: user.id, tenantId: null };
  }

  const tenant = await ensureTenant(persona);
  const structure = await ensureTenantStructure(tenant.id, persona);
  const membership = await ensureMembership({ tenantId: tenant.id, userId: user.id, title: persona.roleCode });
  await ensureRole(membership.id, persona.roleCode);
  await ensureSubscription({ tenantId: tenant.id, planCode: persona.planCode, courtesyDays: persona.courtesyDays });
  await ensureQaPatient({ tenantId: tenant.id, persona, structure });

  return {
    persona: persona.key,
    status: "ready",
    userId: user.id,
    tenantId: tenant.id,
    membershipId: membership.id,
    planCode: persona.planCode,
  };
}

async function ensureAuthUser(email) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  const existing = listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { email_confirm: true });
    return existing;
  }
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: makeRandomPassword(),
    user_metadata: { qa_seed: "qa_m49" },
  });
  if (created.error) throw created.error;
  return created.data.user;
}

async function removeMemberships(userId) {
  const { data: memberships, error } = await admin
    .from("tenant_memberships")
    .select("id")
    .eq("user_id", userId);
  if (error) throw error;
  const membershipIds = (memberships ?? []).map((membership) => membership.id);
  if (membershipIds.length > 0) {
    const roleDelete = await admin.from("membership_roles").delete().in("membership_id", membershipIds);
    if (roleDelete.error) throw roleDelete.error;
  }
  const membershipDelete = await admin.from("tenant_memberships").delete().eq("user_id", userId);
  if (membershipDelete.error) throw membershipDelete.error;
}

async function ensureTenant(persona) {
  const existing = await admin.from("tenants").select("*").eq("slug", persona.tenantSlug).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const inserted = await admin
    .from("tenants")
    .insert({
      slug: persona.tenantSlug,
      name: persona.tenantName,
      status: "active",
      plan_id: persona.planCode,
      institution_type: persona.tenantType,
    })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

async function ensureMembership({ tenantId, userId, title }) {
  const existing = await admin
    .from("tenant_memberships")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    const updated = await admin
      .from("tenant_memberships")
      .update({ status: "active", title, updated_at: new Date().toISOString() })
      .eq("id", existing.data.id)
      .select("*")
      .single();
    if (updated.error) throw updated.error;
    return updated.data;
  }

  const inserted = await admin
    .from("tenant_memberships")
    .insert({ tenant_id: tenantId, user_id: userId, status: "active", title })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

async function ensureTenantStructure(tenantId, persona) {
  const org = await ensureScopedRow("organizations", { tenant_id: tenantId, name: `${persona.tenantName} QA Org` }, {
    tenant_id: tenantId,
    name: `${persona.tenantName} QA Org`,
    type: persona.tenantType === "clinic" ? "clinic" : "personal",
    legal_name: null,
    tax_id: null,
    status: "active",
    updated_at: new Date().toISOString(),
  });
  const branch = await ensureScopedRow("branches", { tenant_id: tenantId, name: "Sede QA" }, {
    tenant_id: tenantId,
    organization_id: org.id,
    name: "Sede QA",
    city: "QA",
    timezone: "America/La_Paz",
    status: "active",
    updated_at: new Date().toISOString(),
  });
  const department = await ensureScopedRow("departments", { tenant_id: tenantId, name: "Nutricion QA" }, {
    tenant_id: tenantId,
    organization_id: org.id,
    branch_id: branch.id,
    name: "Nutricion QA",
    clinical_area: "nutrition",
    updated_at: new Date().toISOString(),
  });
  const service = await ensureScopedRow("services", { tenant_id: tenantId, name: "Consulta QA" }, {
    tenant_id: tenantId,
    department_id: department.id,
    name: "Consulta QA",
    default_pack_id: "clinical",
    care_setting: "outpatient",
    updated_at: new Date().toISOString(),
  });
  return { organizationId: org.id, branchId: branch.id, departmentId: department.id, serviceId: service.id };
}

async function ensureScopedRow(table, match, payload) {
  let query = admin.from(table).select("*");
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }
  const existing = await query.maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    const updated = await admin.from(table).update(payload).eq("id", existing.data.id).select("*").single();
    if (updated.error) throw updated.error;
    return updated.data;
  }
  const inserted = await admin.from(table).insert(payload).select("*").single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

async function ensureRole(membershipId, roleCode) {
  const roleResult = await admin.from("roles").select("id").eq("code", roleCode).is("tenant_id", null).maybeSingle();
  if (roleResult.error) throw roleResult.error;
  if (!roleResult.data?.id) throw new Error(`Rol faltante: ${roleCode}`);

  await admin.from("membership_roles").delete().eq("membership_id", membershipId);
  const inserted = await admin
    .from("membership_roles")
    .insert({ membership_id: membershipId, role_id: roleResult.data.id });
  if (inserted.error) throw inserted.error;
}

async function ensureSubscription({ tenantId, planCode, courtesyDays }) {
  const now = new Date();
  const courtesyEndsAt = courtesyDays ? new Date(now.getTime() + courtesyDays * 24 * 60 * 60 * 1000).toISOString() : null;
  const payload = {
    tenant_id: tenantId,
    plan_id: planCode,
    plan_code: planCode,
    status: planCode === "courtesy" ? "courtesy" : "active",
    starts_at: now.toISOString(),
    ends_at: courtesyEndsAt,
    courtesy_ends_at: courtesyEndsAt,
    payment_provider: "none",
    notes: "qa_m49 synthetic subscription",
    updated_at: now.toISOString(),
  };
  const existing = await admin
    .from("tenant_subscriptions")
    .select("id")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data?.id) {
    const updated = await admin.from("tenant_subscriptions").update(payload).eq("id", existing.data.id);
    if (updated.error) throw updated.error;
    await syncTenantModules(tenantId, planCode);
    return;
  }
  const inserted = await admin.from("tenant_subscriptions").insert(payload);
  if (inserted.error) throw inserted.error;
  await syncTenantModules(tenantId, planCode);
}

async function syncTenantModules(tenantId, planCode) {
  const result = await admin.rpc("sync_tenant_plan_modules", {
    p_tenant_id: tenantId,
    p_plan_code: planCode,
  });
  if (result.error && result.error.code !== "PGRST202") throw result.error;
}

async function ensureQaPatient({ tenantId, persona, structure }) {
  const mrn = `QA-M49-${persona.key.toUpperCase().replace(/[^A-Z0-9]/g, "-")}`;
  const activePacks = persona.planCode === "free"
    ? ["clinical"]
    : persona.planCode === "clinic_hospital"
      ? ["clinical", "enteral", "parenteral", "pediatric", "sport"]
      : ["clinical", "enteral", "parenteral", "pediatric", "sport"];

  const existing = await admin
    .from("patients")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("mrn", mrn)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const payload = {
    tenant_id: tenantId,
    organization_id: structure.organizationId,
    branch_id: structure.branchId,
    service_id: structure.serviceId,
    mrn,
    first_name: "QA",
    last_name: `M49 ${persona.key}`,
    birth_date: "1990-01-01",
    sex: "other",
    status: "active",
    risk_level: "low",
    primary_pack_id: activePacks[0],
    active_pack_ids: activePacks,
    diagnosis_summary: null,
    location_label: "QA synthetic",
    metadata: { qa_seed: "qa_m49", synthetic: true },
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  if (existing.data?.id) {
    const updated = await admin.from("patients").update(payload).eq("id", existing.data.id);
    if (updated.error) throw updated.error;
    return;
  }

  const inserted = await admin.from("patients").insert(payload);
  if (inserted.error) throw inserted.error;
}

async function createStorageState(persona, setup) {
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email: persona.email });
  if (link.error) throw link.error;
  const tokenHash = link.data.properties?.hashed_token;
  if (!tokenHash) throw new Error(`No se pudo generar token hash para ${persona.key}`);

  const verified = await anon.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verified.error) throw verified.error;
  const session = verified.data.session;
  if (!session) throw new Error(`Sesion ausente para ${persona.key}`);

  const statePath = path.join(authDir, persona.storageFile);
  const localStorage = [
    { name: authStorageKey, value: JSON.stringify(session) },
  ];
  if (setup.tenantId) {
    localStorage.unshift({ name: "nutri.activeTenantId", value: setup.tenantId });
  }
  fs.writeFileSync(
    statePath,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: baseUrl,
          localStorage,
        },
      ],
    }),
  );
  return {
    status: "created",
    relativePath: path.relative(repoRoot, statePath).replace(/\\/g, "/"),
  };
}

async function checkRoute(page, persona, route, expected) {
  const url = `${baseUrl}${route}`;
  const result = { persona, route, expected, status: "passed", finalUrl: "", signals: [] };
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1000);
    result.finalUrl = page.url().replace(baseUrl, "");
    let bodyText = await page.locator("body").innerText({ timeout: 5_000 }).catch(() => "");
    if (expected === "blocked" && !hasBlockedCopy(bodyText) && !result.finalUrl.includes("/login")) {
      await page
        .locator("body")
        .filter({ hasText: /no tienes acceso|funcion no incluida|función no incluida|acceso restringido|pack no habilitado|requiere permiso|requiere upgrade|plan requerido/i })
        .waitFor({ state: "visible", timeout: 5_000 })
        .catch(() => undefined);
      bodyText = await page.locator("body").innerText({ timeout: 5_000 }).catch(() => bodyText);
    }
    const lower = bodyText.toLowerCase();
    const signals = [];
    if (!response || response.status() >= 500) signals.push(`http_${response?.status() ?? "none"}`);
    if (lower.includes("no se pudo renderizar") || lower.includes("error de render")) signals.push("error_boundary");
    if (
      lower.includes("cannot read properties") ||
      /\bundefined\b/i.test(bodyText) ||
      /\bnull\b/i.test(bodyText) ||
      /\bNaN\b/.test(bodyText)
    ) {
      signals.push("runtime_text");
    }
    if (
      hasBlockedCopy(bodyText)
    ) {
      signals.push("blocked_copy");
    }
    if (result.finalUrl.includes("/login") || result.finalUrl === "/activate" || result.finalUrl === "/pending-approval") {
      signals.push("redirected_auth");
    }
    result.signals = signals;

    const appearsBlocked = signals.some((signal) => ["blocked_copy", "redirected_auth"].includes(signal)) || result.finalUrl === "/app";
    const hasCriticalSignal = signals.some((signal) => ["http_500", "error_boundary", "runtime_text"].includes(signal));
    if (hasCriticalSignal) result.status = "failed";
    if (expected === "allowed" && appearsBlocked && route !== "/app") result.status = "failed";
    if (expected === "blocked" && !appearsBlocked && !lower.includes("forbidden")) result.status = "failed";
  } catch (error) {
    result.status = "failed";
    result.error = messageOf(error);
  }
  return result;
}

function hasBlockedCopy(bodyText) {
  const lower = bodyText.toLowerCase();
  return (
    lower.includes("acceso restringido") ||
    lower.includes("no tienes acceso") ||
    lower.includes("funcion no incluida") ||
    lower.includes("función no incluida") ||
    lower.includes("pack no habilitado") ||
    lower.includes("requiere permiso") ||
    lower.includes("requiere upgrade") ||
    lower.includes("plan requerido")
  );
}

function writeArtifact(payload) {
  fs.mkdirSync(artifactDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactPath = path.join(artifactDir, `authenticated-functional-${stamp}.json`);
  fs.writeFileSync(artifactPath, JSON.stringify(payload, null, 2));
  return artifactPath;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*(?:\$env:)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
  }
}

function makeRandomPassword() {
  return `QaM49-${cryptoRandom()}-local`;
}

function cryptoRandom() {
  return Array.from(crypto.getRandomValues(new Uint32Array(2)))
    .map((part) => part.toString(36))
    .join("");
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
