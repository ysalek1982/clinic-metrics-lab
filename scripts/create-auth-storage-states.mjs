import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const authDir = path.join(repoRoot, "playwright", ".auth");
const envFile = path.join(repoRoot, ".env.local");

loadEnvFile(envFile);

const baseUrl = process.env.AUTH_BASE_URL || process.env.QA_REMOTE_URL || "https://clinic-metrics-lab.vercel.app";
const accounts = [
  {
    label: "ysalek",
    email: process.env.YSALEK_EMAIL || "ysalek@gmail.com",
    password: process.env.YSALEK_PASSWORD,
    output: "ysalek.json",
  },
  {
    label: "marcela-free",
    email: process.env.MARCELA_EMAIL || "marcelacruz2000@gmail.com",
    password: process.env.MARCELA_TEMP_PASSWORD || process.env.MARCELA_PASSWORD,
    output: "marcela-free.json",
  },
  {
    label: "qa-pro",
    email: process.env.QA_PRO_EMAIL || "qa-pro@nutri.test",
    password: process.env.QA_PRO_PASSWORD,
    output: "qa-pro.json",
  },
  {
    label: "qa-clinic",
    email: process.env.QA_CLINIC_EMAIL || "qa-clinic@nutri.test",
    password: process.env.QA_CLINIC_PASSWORD,
    output: "qa-clinic.json",
  },
  {
    label: "qa-courtesy",
    email: process.env.QA_COURTESY_EMAIL || "qa-courtesy@nutri.test",
    password: process.env.QA_COURTESY_PASSWORD,
    output: "qa-courtesy.json",
  },
  {
    label: "qa-no-membership",
    email: process.env.QA_NO_MEMBERSHIP_EMAIL || "qa-no-membership@nutri.test",
    password: process.env.QA_NO_MEMBERSHIP_PASSWORD,
    output: "qa-no-membership.json",
  },
].filter((account) => account.email);

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  console.log(`Playwright no disponible: ${messageOf(error)}`);
  process.exit(0);
}

fs.mkdirSync(authDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const account of accounts) {
  if (!account.password) {
    results.push({ label: account.label, status: "skipped", reason: "password_missing" });
    continue;
  }

  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator("#email").fill(account.email);
    await page.locator("#password").fill(account.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/app|\/activate|\/activate-invite|\/pending-approval/, { timeout: 30_000 });
    await page.context().storageState({ path: path.join(authDir, account.output) });
    results.push({ label: account.label, status: "created", output: `playwright/.auth/${account.output}` });
  } catch (error) {
    results.push({ label: account.label, status: "failed", error: messageOf(error) });
  } finally {
    await page.close().catch(() => undefined);
  }
}

await browser.close();

console.log("Storage states auth");
console.log("No se imprimen passwords.");
for (const result of results) {
  if (result.status === "created") {
    console.log(`${result.label}: creado en ${result.output}`);
  } else if (result.status === "skipped") {
    console.log(`${result.label}: omitido (${result.reason})`);
  } else {
    console.log(`${result.label}: fallo (${result.error})`);
  }
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

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
