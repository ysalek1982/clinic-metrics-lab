import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "e2e", "reports-export");
const baseUrl = process.env.REPORT_E2E_BASE_URL || process.env.E2E_BASE_URL || "https://clinic-metrics-lab.vercel.app";
const storageStatePath = process.env.REPORT_E2E_STORAGE_STATE || process.env.E2E_STORAGE_STATE || path.join(repoRoot, "playwright", ".auth", "qa-pro.json");

loadEnvFile(path.join(repoRoot, ".env.local"));
fs.mkdirSync(artifactDir, { recursive: true });

const result = {
  baseUrl,
  artifacts: artifactDir,
  tenantId: null,
  reportRunId: null,
  downloads: [],
  auditEvents: {},
  blockedReason: null,
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!fs.existsSync(storageStatePath)) {
  result.blockedReason = `No existe storage state autenticado: ${storageStatePath}`;
  writeResult();
  process.exit(0);
}

if (!supabaseUrl || !anonKey) {
  result.blockedReason = "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.";
  writeResult();
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  acceptDownloads: true,
  storageState: storageStatePath,
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(`${baseUrl}/app/reports`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
  await visible(page.locator("body").filter({ hasText: /Centro de reportes/i }), "Centro de reportes");
  assert(pageErrors.length === 0, `La pagina emitio errores runtime: ${pageErrors.join(" | ")}`);

  const token = await getAccessTokenFromPage(page);
  const tenantId = await getActiveTenantIdFromPage(page);
  result.tenantId = tenantId;

  const generateButton = await firstEnabled(page.getByRole("button", { name: /^Generar$/i }), "boton Generar habilitado");
  await generateButton.click();
  await visible(page.locator("body").filter({ hasText: /Reporte generado y auditado/i }), "reporte generado");

  const reportRun = await waitForApiRow(
    "report_runs",
    token,
    {
      tenant_id: `eq.${tenantId}`,
      order: "created_at.desc",
      limit: "1",
    },
    (rows) => rows[0],
    "report_run generado",
  );
  result.reportRunId = stringValue(reportRun.id);
  await waitForAudit(token, "report.generated", result.reportRunId);

  const previewDrawer = page.getByRole("dialog").filter({ hasText: /Generado:/i });
  if ((await previewDrawer.count()) === 0 || !(await previewDrawer.first().isVisible().catch(() => false))) {
    const previewButton = await firstEnabled(page.getByRole("button", { name: /Vista previa/i }), "boton Vista previa habilitado");
    await previewButton.click();
  }
  await visible(previewDrawer, "drawer vista previa");
  await page.screenshot({ path: path.join(artifactDir, "01-report-preview.png"), fullPage: true });

  await downloadFromPreview(page, "PDF", "pdf");
  await waitForAudit(token, "report.exported", result.reportRunId, (row) => row.after_data?.format === "pdf");

  await downloadFromPreview(page, "Excel", "xlsx");
  await waitForAudit(token, "report.exported", result.reportRunId, (row) => row.after_data?.format === "xlsx");

  await page.goto(`${baseUrl}/app/audit`, { waitUntil: "domcontentloaded" });
  await visible(page.locator("body").filter({ hasText: /report\.exported/i }), "report.exported visible en auditoria");
  await page.screenshot({ path: path.join(artifactDir, "02-report-exported-audit.png"), fullPage: true });

  writeResult();
} finally {
  await browser.close();
}

async function downloadFromPreview(page, label, extension) {
  const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
  await page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).click();
  const download = await downloadPromise;
  const suggested = download.suggestedFilename();
  const targetPath = path.join(artifactDir, `report-export-${Date.now()}.${extension}`);
  await download.saveAs(targetPath);
  const size = fs.statSync(targetPath).size;
  assert(size > 0, `La descarga ${label} quedo vacia.`);
  result.downloads.push({ label, suggestedFilename: suggested, artifact: targetPath, bytes: size });
}

async function firstEnabled(locator, label) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isEnabled().catch(() => false)) return candidate;
  }
  throw new Error(`No se encontro ${label}.`);
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
    const bodyText = await locator.page().locator("body").innerText({ timeout: 1000 }).catch(() => "");
    await locator.page().screenshot({
      path: path.join(artifactDir, `debug-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`),
      fullPage: true,
    }).catch(() => undefined);
    throw new Error(`No se encontro UI visible para ${label}. URL=${locator.page().url()} Texto=${bodyText.slice(0, 600)} ${message}`);
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`No se encontro ${label}. Ultimas filas: ${JSON.stringify(lastRows).slice(0, 800)}`);
}

async function waitForAudit(token, eventType, entityId, predicate = () => true) {
  const row = await waitForApiRow(
    "audit_logs",
    token,
    {
      event_type: `eq.${eventType}`,
      entity_id: `eq.${entityId}`,
      order: "created_at.desc",
      limit: "10",
    },
    (rows) => rows.find((item) => predicate(item)),
    `audit ${eventType}`,
  );
  result.auditEvents[eventType] = result.auditEvents[eventType] || [];
  result.auditEvents[eventType].push(stringValue(row.id));
  return row;
}

async function restSelect(table, token, filters) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error(`${table} REST ${response.status}: ${await response.text()}`);
  return response.json();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stringValue(value) {
  return typeof value === "string" ? value : "";
}

function writeResult() {
  fs.writeFileSync(path.join(artifactDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
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
