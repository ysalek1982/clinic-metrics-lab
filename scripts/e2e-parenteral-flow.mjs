import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "e2e", "parenteral-m51");
const baseUrl = process.env.PARENTERAL_E2E_BASE_URL || process.env.E2E_BASE_URL || "https://clinic-metrics-lab.vercel.app";
const storageStatePath =
  process.env.PARENTERAL_E2E_STORAGE_STATE ||
  process.env.E2E_STORAGE_STATE ||
  path.join(repoRoot, "playwright", ".auth", "qa-clinic.json");
let expectedTenantId = process.env.PARENTERAL_E2E_TENANT_ID || process.env.E2E_TENANT_ID || null;

loadEnvFile(path.join(repoRoot, ".env.local"));
fs.mkdirSync(artifactDir, { recursive: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const result = {
  baseUrl,
  artifacts: artifactDir,
  tenantId: null,
  patientId: null,
  planId: null,
  logId: null,
  rlsAnon: {},
  auditEvents: {},
  screenshots: [],
  blockedReason: null,
};

if (!supabaseUrl || !supabaseKey) {
  result.blockedReason = "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY para validar API/RLS.";
  writeResult();
  process.exit(0);
}

if (!fs.existsSync(storageStatePath)) {
  result.blockedReason = `No existe storage state autenticado: ${storageStatePath}`;
  writeResult();
  process.exit(0);
}

await validateAnonRls();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storageStatePath });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(`${baseUrl}/app/pack/parenteral`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
  if (page.url().includes("/login")) {
    throw new Error("La sesion autenticada expiro; regenera storage state antes de ejecutar e2e:parenteral.");
  }

  expectedTenantId = expectedTenantId || (await getActiveTenantIdFromPage(page));
  result.tenantId = expectedTenantId;
  await page.addInitScript((tenantId) => {
    window.localStorage.setItem("nutri.activeTenantId", tenantId);
  }, expectedTenantId);

  const token = await getAccessTokenFromPage(page);
  await runParenteralFlow(page, token);
  writeResult();
} finally {
  await browser.close();
}

async function runParenteralFlow(page, token) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const physician = `QA PARENTERAL M51 ${stamp}`;
  const monitoringNotes = `QA M51 monitoreo indicado ${stamp}`;
  const editedMonitoringNotes = `${monitoringNotes} edit`;
  const logNotes = `QA M51 log parenteral ${stamp}`;
  const complications = `QA M51 control sin complicacion critica ${stamp}`;

  await page.goto(`${baseUrl}/app/pack/parenteral`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
  await visible(page.locator("body").filter({ hasText: /Parenteral/i }), "vista Parenteral");
  assert(pageErrors.length === 0, `La pagina emitio errores runtime: ${pageErrors.join(" | ")}`);
  assert((await page.getByText(/DEMO/i).count()) === 0, "La vista autenticada no debe mostrar DEMO.");

  await page.getByTestId("parenteral-new-plan-button").click();
  await visible(page.getByTestId("parenteral-plan-drawer"), "drawer nuevo plan parenteral");
  await page.getByTestId("parenteral-patient-select").click();
  const patientOption = page.getByRole("option").first();
  await visible(patientOption, "primer paciente real en selector");
  await patientOption.click();
  await page.getByTestId("parenteral-start-date-input").fill(new Date().toISOString().slice(0, 10));
  await selectByTestId(page, "parenteral-status-select", "Activo");
  await page.getByTestId("parenteral-volume-input").fill("1500");
  await page.getByTestId("parenteral-glucose-input").fill("180");
  await page.getByTestId("parenteral-amino-input").fill("75");
  await page.getByTestId("parenteral-lipids-input").fill("60");
  await page.getByTestId("parenteral-physician-input").fill(physician);
  await page.getByTestId("parenteral-electrolytes-input").fill("QA M51 electrolitos controlados");
  await page.getByTestId("parenteral-micronutrients-input").fill("QA M51 micronutrientes registrados");
  await page.getByTestId("parenteral-monitoring-input").fill(monitoringNotes);
  await page.getByTestId("parenteral-save-button").click();
  await visible(planRow(page, physician), "plan parenteral creado");
  await screenshot(page, "01-parenteral-plan-created.png");

  const plan = await waitForApiRow(
    "parenteral_plans",
    token,
    { prescribing_physician: `eq.${physician}`, order: "created_at.desc", limit: "1" },
    (rows) => rows[0],
    "parenteral_plans creado",
  );
  result.planId = stringValue(plan.id);
  result.patientId = stringValue(plan.patient_id);
  assert(stringValue(plan.tenant_id) === expectedTenantId, "El plan no quedo asociado al tenant activo esperado.");
  assert(stringValue(plan.status) === "active", "El plan no quedo activo despues de crear.");
  assert(Number(plan.total_volume_ml) === 1500, "El volumen inicial no persistio.");
  await waitForAudit(token, "parenteral_plan.create", result.planId);

  await page.reload({ waitUntil: "domcontentloaded" });
  let row = planRow(page, physician);
  await visible(row, "plan parenteral tras recarga");
  await row.getByTestId("parenteral-edit-button").click();
  await visible(page.getByTestId("parenteral-plan-drawer"), "drawer editar plan parenteral");
  await page.getByTestId("parenteral-volume-input").fill("1550");
  await page.getByTestId("parenteral-glucose-input").fill("190");
  await page.getByTestId("parenteral-monitoring-input").fill(editedMonitoringNotes);
  await page.getByTestId("parenteral-save-button").click();
  await visible(planRow(page, physician).filter({ hasText: /1[.,]?550|1550/i }), "volumen editado visible");
  await screenshot(page, "02-parenteral-plan-edited.png");
  await waitForApiRow(
    "parenteral_plans",
    token,
    { id: `eq.${result.planId}` },
    (rows) => rows.find((item) => Number(item.total_volume_ml) === 1550 && Number(item.glucose_g) === 190),
    "parenteral_plan editado",
  );
  await waitForAudit(token, "parenteral_plan.update", result.planId);

  await page.reload({ waitUntil: "domcontentloaded" });
  row = planRow(page, physician);
  await visible(row, "plan parenteral para log");
  await row.getByTestId("parenteral-log-button").click();
  await visible(page.getByTestId("parenteral-log-drawer"), "drawer monitoreo parenteral");
  await page.getByTestId("parenteral-log-glucose-input").fill("144");
  await page.getByTestId("parenteral-log-triglycerides-input").fill("155");
  await page.getByTestId("parenteral-log-liver-input").fill("QA M51 hepatico estable");
  await page.getByTestId("parenteral-log-catheter-input").fill("QA M51 cateter sin incidencia");
  await page.getByTestId("parenteral-log-complications-input").fill(complications);
  await page.getByTestId("parenteral-log-notes-input").fill(logNotes);
  await page.getByTestId("parenteral-log-save-button").click();
  await visible(planRow(page, physician).filter({ hasText: /Glu\s*144|TG\s*155/i }), "log parenteral visible");
  await screenshot(page, "03-parenteral-log-created.png");

  const log = await waitForApiRow(
    "parenteral_monitoring_logs",
    token,
    { parenteral_plan_id: `eq.${result.planId}`, notes: `eq.${logNotes}`, order: "created_at.desc", limit: "1" },
    (rows) => rows[0],
    "parenteral_monitoring_logs creado",
  );
  result.logId = stringValue(log.id);
  assert(stringValue(log.tenant_id) === expectedTenantId, "El log no quedo asociado al tenant activo esperado.");
  assert(stringValue(log.patient_id) === result.patientId, "El log no quedo asociado al paciente del plan.");
  await waitForAudit(token, "parenteral_log.create", result.logId);

  await page.goto(`${baseUrl}/app/patients/${result.patientId}`, { waitUntil: "domcontentloaded" });
  await visible(page.locator("body").filter({ hasText: /Soporte nutricional hospitalario/i }), "soporte hospitalario en expediente");
  await visible(page.locator("body").filter({ hasText: /Parenteral|QA PARENTERAL M51/i }), "parenteral en expediente");
  await screenshot(page, "04-patient-detail-parenteral.png");

  await page.goto(`${baseUrl}/app/pack/parenteral`, { waitUntil: "domcontentloaded" });
  row = planRow(page, physician);
  await visible(row, "plan parenteral antes de cerrar");
  await row.getByTestId("parenteral-close-button").click();
  await visible(page.getByRole("dialog").filter({ hasText: /Cerrar plan parenteral/i }), "dialog cerrar plan parenteral");
  await page.getByRole("button", { name: /^Cerrar plan$/i }).click();
  await visible(planRow(page, physician).getByText(/Cerrado/i), "estado cerrado");
  await waitForApiRow(
    "parenteral_plans",
    token,
    { id: `eq.${result.planId}` },
    (rows) => rows.find((item) => stringValue(item.status) === "closed"),
    "parenteral_plan closed",
  );
  await waitForAudit(token, "parenteral_plan.closed", result.planId);
  await screenshot(page, "05-parenteral-plan-closed.png");

  await page.goto(`${baseUrl}/app/audit`, { waitUntil: "domcontentloaded" });
  await visible(page.locator("body").filter({ hasText: /parenteral_plan\.closed|parenteral_log\.create/i }), "audit logs parenterales en UI");
  await screenshot(page, "06-audit-parenteral.png");
}

function planRow(page, physician) {
  return page.locator('[data-testid="parenteral-plan-row"]').filter({ hasText: physician }).first();
}

async function selectByTestId(page, testId, optionName) {
  await page.getByTestId(testId).click();
  await page.getByRole("option", { name: optionName }).click();
}

async function visible(locator, label, timeout = 20000) {
  try {
    await locator.waitFor({ state: "visible", timeout });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("strict mode violation")) {
      await locator.first().waitFor({ state: "visible", timeout: 1000 });
      return;
    }
    const page = locator.page();
    const bodyText = await page.locator("body").innerText({ timeout: 1000 }).catch(() => "");
    await screenshot(page, `debug-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`).catch(() => undefined);
    throw new Error(`No se encontro UI visible para: ${label}. URL=${page.url()} Texto=${bodyText.slice(0, 600)} ${message}`);
  }
}

async function screenshot(page, fileName) {
  const fullPath = path.join(artifactDir, fileName);
  await page.screenshot({ path: fullPath, fullPage: true });
  result.screenshots.push(fullPath);
}

async function getAccessTokenFromPage(page) {
  const entries = await page.evaluate(() => Object.entries(localStorage));
  for (const [key, rawValue] of entries) {
    if (!key.startsWith("sb-") || !key.includes("auth-token")) continue;
    const parsed = JSON.parse(rawValue);
    const token = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token;
    if (typeof token === "string" && token.length > 20) return token;
  }
  throw new Error("No se pudo obtener access token de Supabase desde storage local autenticado.");
}

async function getActiveTenantIdFromPage(page) {
  const activeTenantId = await page.evaluate(() => localStorage.getItem("nutri.activeTenantId"));
  if (typeof activeTenantId === "string" && activeTenantId.length > 0) return activeTenantId;
  throw new Error("No se pudo resolver nutri.activeTenantId desde storage local autenticado.");
}

async function waitForApiRow(table, token, filters, pick, label) {
  const deadline = Date.now() + 30000;
  let lastRows = [];
  while (Date.now() < deadline) {
    lastRows = await restSelect(table, token, filters);
    const found = pick(lastRows);
    if (found) return found;
    await delay(750);
  }
  throw new Error(`No se encontro evidencia API para ${label}. Ultimas filas: ${JSON.stringify(lastRows).slice(0, 700)}`);
}

async function waitForAudit(token, eventType, entityId) {
  const row = await waitForApiRow(
    "audit_logs",
    token,
    { event_type: `eq.${eventType}`, entity_id: `eq.${entityId}`, order: "created_at.desc", limit: "10" },
    (rows) => rows[0],
    `audit ${eventType}`,
  );
  result.auditEvents[eventType] = stringValue(row.id);
  assert(Boolean(row.tenant_id), `Audit ${eventType} no tiene tenant_id.`);
  assert(Boolean(row.actor_user_id), `Audit ${eventType} no tiene actor_user_id.`);
  assert(Boolean(row.entity_type), `Audit ${eventType} no tiene entity_type.`);
  assert(Boolean(row.entity_id), `Audit ${eventType} no tiene entity_id.`);
  assert(Boolean(row.created_at), `Audit ${eventType} no tiene created_at.`);
  return row;
}

async function validateAnonRls() {
  const tables = ["parenteral_plans", "parenteral_monitoring_logs"];
  for (const table of tables) {
    const rows = await restSelect(table, null, { select: "id", limit: "1" });
    assert(Array.isArray(rows), `Anon ${table} no devolvio array controlado.`);
    assert(rows.length === 0, `Anon ${table} expuso datos clinicos.`);
    result.rlsAnon[table] = "200 []";
  }
}

async function restSelect(table, token, filters = {}) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", filters.select || "*");
  for (const [key, value] of Object.entries(filters)) {
    if (key === "select") continue;
    url.searchParams.set(key, value);
  }
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${token || supabaseKey}`,
  };
  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`REST ${table} fallo con ${response.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : [];
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

function stringValue(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeResult() {
  fs.writeFileSync(path.join(artifactDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
}
