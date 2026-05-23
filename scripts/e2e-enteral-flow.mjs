import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "e2e", "enteral-f9i");
const storageStatePath = process.env.E2E_STORAGE_STATE || path.join(artifactDir, "auth-state.json");
const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:8080";
let expectedTenantId = process.env.E2E_TENANT_ID || null;

loadEnvFile(path.join(repoRoot, ".env.local"));
fs.mkdirSync(artifactDir, { recursive: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;

const result = {
  baseUrl,
  artifacts: artifactDir,
  formulaName: null,
  tenantId: null,
  patientId: null,
  planId: null,
  logId: null,
  rlsAnon: {},
  auditEvents: {},
  blockedReason: null,
};

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Falta VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY o sus equivalentes NEXT_PUBLIC para validar API/RLS.");
}

await validateAnonRls();

const hasReusableStorage = fs.existsSync(storageStatePath);
if (!hasReusableStorage && (!e2eEmail || !e2ePassword)) {
  result.blockedReason = "Falta sesión autenticada o E2E_EMAIL/E2E_PASSWORD para ejecutar E2E UI.";
  writeResult();
  throw new Error(result.blockedReason);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  result.blockedReason = "Falta dependencia Playwright. Ejecuta npm install -D @playwright/test y npx playwright install chromium.";
  writeResult();
  throw new Error(result.blockedReason);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext(hasReusableStorage ? { storageState: storageStatePath } : {});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await ensureAuthenticated(page);
  expectedTenantId = expectedTenantId || (await getActiveTenantIdFromPage(page));
  result.tenantId = expectedTenantId;
  await page.addInitScript((tenantId) => {
    window.localStorage.setItem("nutri.activeTenantId", tenantId);
  }, expectedTenantId);
  const token = await getAccessTokenFromPage(page);
  await runEnteralFlow(page, token);
  writeResult();
} finally {
  await browser.close();
}

async function ensureAuthenticated(page) {
  await page.goto(`${baseUrl}/app/pack/enteral/cockpit`, { waitUntil: "domcontentloaded" });
  if (page.url().includes("/login") || (await page.locator('input[type="password"]').count()) > 0) {
    if (!e2eEmail || !e2ePassword) {
      throw new Error("La sesión reutilizable expiró y faltan E2E_EMAIL/E2E_PASSWORD para login UI.");
    }
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(e2eEmail);
    await page.locator('input[type="password"]').fill(e2ePassword);
    await page.getByRole("button", { name: /Entrar con Supabase/i }).click();
    await page.waitForURL(/\/app(\/)?$/, { timeout: 30000 });
    await page.context().storageState({ path: storageStatePath });
  }
}

async function runEnteralFlow(page, token) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const formulaName = `FORMULA MANUAL F9I ${stamp}`;
  const notes = `QA Enteral F9I ${stamp}`;
  const editedNotes = `${notes} editado`;
  const logNotes = `QA log riesgo F9I ${stamp}`;
  result.formulaName = formulaName;

  await page.goto(`${baseUrl}/app/pack/enteral/cockpit`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
  await visible(page.locator("body").filter({ hasText: /Cockpit enteral/i }), "Cockpit enteral");
  await visible(page.locator("body").filter({ hasText: /Datos reales/i }), "badge Datos reales");
  assert((await page.getByText(/DEMO/i).count()) === 0, "La vista autenticada no debe mostrar DEMO.");
  assert(pageErrors.length === 0, `La página emitió errores runtime: ${pageErrors.join(" | ")}`);

  await page.getByTestId("enteral-new-support-button").click();
  await visible(page.getByTestId("enteral-plan-drawer"), "drawer de plan enteral");
  await page.getByTestId("enteral-patient-select").click();
  const patientOption = page.getByRole("option").first();
  await visible(patientOption, "primer paciente real en selector");
  await patientOption.click();
  await page.getByTestId("enteral-formula-input").fill(formulaName);
  await page.getByTestId("enteral-formula-type-input").fill("Fórmula registrada manualmente");
  await page.getByTestId("enteral-target-volume-input").fill("1600");
  await page.getByTestId("enteral-target-kcal-input").fill("1800");
  await page.getByTestId("enteral-target-protein-input").fill("92");
  await page.getByTestId("enteral-water-flush-input").fill("250");
  await page.getByTestId("enteral-rate-input").fill("68");
  await page.getByTestId("enteral-start-date-input").fill(new Date().toISOString().slice(0, 10));
  await page.getByTestId("enteral-notes-input").fill(notes);
  await page.getByTestId("enteral-save-button").click();
  await visible(page.getByText(formulaName), "plan enteral creado");
  await page.screenshot({ path: path.join(artifactDir, "01-cockpit-plan-created.png"), fullPage: true });

  const plan = await waitForApiRow("enteral_plans", token, { formula_name: `eq.${formulaName}` }, (rows) => rows[0], "enteral_plans formula F9I");
  result.planId = stringValue(plan.id);
  result.patientId = stringValue(plan.patient_id);
  assert(stringValue(plan.tenant_id) === expectedTenantId, "El plan no quedó asociado al tenant activo esperado.");
  assert(Boolean(plan.patient_id), "El plan no quedó asociado a un paciente.");
  assert(["active", "activo"].includes(stringValue(plan.status)), "El plan no quedó activo después de crear.");
  await waitForAudit(token, "enteral_plan.create", result.planId);

  await page.reload({ waitUntil: "domcontentloaded" });
  let row = planRow(page, formulaName);
  await visible(row, "plan F9I tras recarga");
  await row.getByTestId("enteral-edit-button").click();
  await visible(page.getByTestId("enteral-plan-drawer"), "drawer editar plan enteral");
  await page.getByTestId("enteral-target-volume-input").fill("1650");
  await page.getByTestId("enteral-target-kcal-input").fill("1850");
  await page.getByTestId("enteral-target-protein-input").fill("95");
  await page.getByTestId("enteral-rate-input").fill("70");
  await page.getByTestId("enteral-notes-input").fill(editedNotes);
  await page.getByTestId("enteral-save-button").click();
  await visible(page.locator("body").filter({ hasText: /(?:1[.,]?650|1650)\s*ml\s*objetivo/i }), "volumen editado visible");
  await page.screenshot({ path: path.join(artifactDir, "02-cockpit-plan-edited.png"), fullPage: true });
  await waitForApiRow(
    "enteral_plans",
    token,
    { id: `eq.${result.planId}` },
    (rows) => rows.find((item) => Number(item.target_volume_ml) === 1650 && Number(item.target_kcal) === 1850 && Number(item.target_protein_g) === 95),
    "enteral_plans editado",
  );
  await waitForAudit(token, "enteral_plan.update", result.planId);

  await page.reload({ waitUntil: "domcontentloaded" });
  row = planRow(page, formulaName);
  await visible(row, "plan F9I para control diario");
  await row.getByTestId("enteral-control-button").click();
  await visible(page.getByTestId("enteral-log-drawer"), "drawer control diario");
  await page.getByTestId("enteral-delivered-volume-input").fill("900");
  await page.getByTestId("enteral-delivered-kcal-input").fill("950");
  await page.getByTestId("enteral-delivered-protein-input").fill("45");
  await page.getByTestId("enteral-gastric-residual-input").fill("320");
  await page.getByTestId("enteral-vomiting-checkbox").click();
  await page.getByTestId("enteral-distension-checkbox").click();
  await page.getByTestId("enteral-log-notes-input").fill(logNotes);
  await page.getByTestId("enteral-log-save-button").click();
  await visible(page.locator("body").filter({ hasText: /54[.,]5\s*%?\s*volumen entregado|55\s*%?\s*volumen entregado/i }), "porcentaje de volumen entregado");
  await visible(page.locator("body").filter({ hasText: /Mala tolerancia/i }), "estado de tolerancia calculado");
  await visible(page.getByText(/residuo 320 ml/i), "residuo gástrico del log");
  await page.screenshot({ path: path.join(artifactDir, "03-cockpit-log-tolerance.png"), fullPage: true });

  const log = await waitForApiRow(
    "enteral_daily_logs",
    token,
    { plan_id: `eq.${result.planId}`, observations: `eq.${logNotes}` },
    (rows) => rows[0],
    "enteral_daily_logs F9I",
  );
  result.logId = stringValue(log.id);
  assert(stringValue(log.tenant_id) === expectedTenantId, "El log no quedó asociado al tenant activo esperado.");
  assert(stringValue(log.patient_id) === result.patientId, "El log no quedó asociado al paciente del plan.");
  await waitForAudit(token, "enteral_daily_log.create", result.logId);

  await page.goto(`${baseUrl}/app/alerts`, { waitUntil: "domcontentloaded" });
  await visible(page.locator("body").filter({ hasText: /Soporte enteral/i }), "alerta enteral derivada");
  await visible(page.locator("body").filter({ hasText: /volumen_bajo|vomitos|distension_abdominal|volumen 54[.,]5%|volumen 55%/i }), "motivo de alerta enteral");
  await page.screenshot({ path: path.join(artifactDir, "04-alerts-enteral.png"), fullPage: true });

  await page.goto(`${baseUrl}/app/patients/${result.patientId}`, { waitUntil: "domcontentloaded" });
  await visible(page.getByText(/Soporte nutricional hospitalario/i), "sección soporte hospitalario en PatientDetail");
  await visible(page.getByText(formulaName), "plan F9I en PatientDetail");
  await visible(page.getByText(/Mala tolerancia|54\.5%|55%/i), "tolerancia o volumen en PatientDetail");
  await page.screenshot({ path: path.join(artifactDir, "05-patient-detail-enteral.png"), fullPage: true });

  await page.goto(`${baseUrl}/app/pack/enteral/cockpit`, { waitUntil: "domcontentloaded" });
  row = planRow(page, formulaName);
  await visible(row, "plan F9I antes de pausar");
  await row.getByTestId("enteral-pause-button").click();
  await visible(page.getByRole("dialog").filter({ hasText: /Pausar soporte enteral/i }), "dialog pausar soporte enteral");
  await page.getByRole("button", { name: /^Pausar plan$/i }).click();
  await visible(row.getByText(/Pausado/i), "estado pausado");
  await waitForApiRow("enteral_plans", token, { id: `eq.${result.planId}` }, (rows) => rows.find((item) => stringValue(item.status) === "paused"), "enteral_plan paused");
  await waitForAudit(token, "enteral_plan.paused", result.planId);

  row = planRow(page, formulaName);
  await row.getByTestId("enteral-close-button").click();
  await visible(page.getByRole("dialog").filter({ hasText: /Cerrar soporte enteral/i }), "dialog cerrar soporte enteral");
  await page.getByRole("button", { name: /^Cerrar plan$/i }).click();
  await visible(row.getByText(/Cerrado/i), "estado cerrado");
  await waitForApiRow("enteral_plans", token, { id: `eq.${result.planId}` }, (rows) => rows.find((item) => stringValue(item.status) === "closed"), "enteral_plan closed");
  await waitForAudit(token, "enteral_plan.closed", result.planId);
  await page.screenshot({ path: path.join(artifactDir, "06-cockpit-plan-closed.png"), fullPage: true });

  await page.goto(`${baseUrl}/app/audit`, { waitUntil: "domcontentloaded" });
  await visible(page.getByText(/enteral_plan\.closed|enteral_plan\.paused|enteral_daily_log\.create/i), "audit logs enterales en UI");
  await page.screenshot({ path: path.join(artifactDir, "07-audit-enteral.png"), fullPage: true });
}

function planRow(page, formulaName) {
  return page.locator('[data-testid="enteral-plan-row"]').filter({ hasText: formulaName }).first();
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
    await page.screenshot({
      path: path.join(artifactDir, `debug-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`),
      fullPage: true,
    }).catch(() => undefined);
    throw new Error(`No se encontró UI visible para: ${label}. URL=${page.url()} Texto=${bodyText.slice(0, 600)} ${error instanceof Error ? error.message : ""}`);
  }
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
  throw new Error(`No se encontró evidencia API para ${label}. Últimas filas: ${JSON.stringify(lastRows).slice(0, 500)}`);
}

async function waitForAudit(token, eventType, entityId) {
  const row = await waitForApiRow(
    "audit_logs",
    token,
    { event_type: `eq.${eventType}`, entity_id: `eq.${entityId}` },
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
  const tables = ["enteral_plans", "enteral_daily_logs", "parenteral_plans", "parenteral_monitoring_logs"];
  for (const table of tables) {
    const rows = await restSelect(table, null, { select: "id", limit: "1" });
    assert(Array.isArray(rows), `Anon ${table} no devolvió array controlado.`);
    assert(rows.length === 0, `Anon ${table} expuso datos clínicos.`);
    result.rlsAnon[table] = "200 []";
  }
}

async function restSelect(table, token, filters = {}) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", filters.select || "*");
  if (filters.limit) url.searchParams.set("limit", filters.limit);
  for (const [key, value] of Object.entries(filters)) {
    if (key === "select" || key === "limit") continue;
    url.searchParams.set(key, value);
  }
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${token || supabaseKey}`,
  };
  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`REST ${table} falló con ${response.status}: ${text.slice(0, 300)}`);
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
