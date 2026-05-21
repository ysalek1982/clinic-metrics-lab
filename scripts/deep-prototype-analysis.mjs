import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sanitizeRouteName } from "./lib/smoke-detectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const prototypeBase = "https://preview--clinic-metrics-lab.lovable.app";
const explicitNutriBase = process.env.DEEP_NUTRI_URL;
let nutriBase = explicitNutriBase || "http://127.0.0.1:4321";
const artifactRoot = path.join(repoRoot, "artifacts", "prototype-deep");
const prototypeDir = path.join(artifactRoot, "prototype");
const nutriDir = path.join(artifactRoot, "nutri");
const startedServer = { process: null };

const prototypeRoutes = [
  "/app",
  "/app/copilot",
  "/app/patients",
  "/app/labs",
  "/app/reports",
  "/app/foods",
  "/app/recipes",
  "/app/weekly-menu",
  "/app/pediatric-curves",
];

const nutriRoutes = [
  "/app",
  "/app/copilot",
  "/app/patients",
  "/app/anthropometry",
  "/app/screening",
  "/app/plans",
  "/app/agenda",
  "/app/messages",
  "/app/alerts",
  "/app/reports",
  "/app/labs",
  "/app/foods",
  "/app/recipes",
  "/app/weekly-menu",
  "/app/pediatric-curves",
  "/app/pack/enteral/cockpit",
  "/app/pack/parenteral",
  "/app/somatocarta",
  "/app/users",
  "/app/audit",
  "/app/settings",
  "/app/organization",
];

fs.mkdirSync(prototypeDir, { recursive: true });
fs.mkdirSync(nutriDir, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  writeArtifact({
    status: "blocked",
    reason: "Playwright no esta disponible.",
    error: messageOf(error),
  });
  process.exit(0);
}

try {
  if (!explicitNutriBase) {
    const port = await findFreePort(Number(new URL(nutriBase).port || 4321));
    nutriBase = `http://127.0.0.1:${port}`;
    startedServer.process = startDevServer(port);
    await waitForReachable(nutriBase, 45_000).catch(() => undefined);
  } else if (!(await isReachable(nutriBase))) {
    startedServer.process = startDevServer(Number(new URL(nutriBase).port || 4321));
    await waitForReachable(nutriBase, 45_000).catch(() => undefined);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const prototype = [];
  for (const route of prototypeRoutes) {
    prototype.push(await captureDeepRoute(page, prototypeBase, route, prototypeDir));
  }

  const nutri = [];
  for (const route of nutriRoutes) {
    nutri.push(await captureDeepRoute(page, nutriBase, route, nutriDir));
  }

  await browser.close();

  const artifactPath = writeArtifact({
    status: "completed",
    generatedAt: new Date().toISOString(),
    prototypeBase,
    nutriBase,
    prototype,
    nutri,
    limitations: [
      "El prototipo se analiza como SPA renderizada. El contenido visible puede depender de estado interno o datos demo del proveedor.",
      "Nutri local puede redirigir a login si no hay sesion autenticada; eso no equivale a validacion E2E autenticada.",
    ],
  });
  console.log(`Analisis profundo de prototipo generado. Artifact: ${artifactPath}`);
} finally {
  if (startedServer.process) stopProcessTree(startedServer.process);
}

async function captureDeepRoute(page, baseUrl, route, targetDir) {
  const url = `${baseUrl}${route}`;
  const screenshotPath = path.join(targetDir, `${sanitizeRouteName(route)}.png`);
  const result = {
    route,
    url,
    finalUrl: null,
    status: "unknown",
    screenshotPath,
    title: "",
    metadata: null,
    error: null,
  };

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    result.status = response ? String(response.status()) : "no_response";
    result.finalUrl = page.url();
    result.title = await page.locator("h1, h2, [data-page-title]").first().innerText({ timeout: 2_000 }).catch(() => "");
    result.metadata = await page.evaluate(() => {
      const compact = (value) => String(value || "").replace(/\s+/g, " ").trim();
      const texts = (selector, limit = 40) =>
        Array.from(document.querySelectorAll(selector))
          .map((element) => compact(element.textContent))
          .filter(Boolean)
          .slice(0, limit);
      const buttons = Array.from(document.querySelectorAll("button, a"))
        .map((element) => ({
          text: compact(element.textContent),
          href: element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "",
          disabled: element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true",
        }))
        .filter((item) => item.text || item.href)
        .slice(0, 80);
      const formControls = Array.from(document.querySelectorAll("input, textarea, select"))
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          label:
            element.getAttribute("aria-label") ||
            element.getAttribute("placeholder") ||
            element.getAttribute("name") ||
            element.id ||
            "",
          type: element.getAttribute("type") || "",
        }))
        .slice(0, 60);
      return {
        visibleTitle: texts("h1, h2, [data-page-title]", 12),
        sidebarItems: texts("aside a, aside button, nav a, nav button", 80),
        topbarItems: texts("header a, header button, [data-topbar] a, [data-topbar] button", 40),
        buttons,
        cards: texts("[class*='card'], .panel, section, article", 40),
        badges: texts("[class*='badge'], [class*='Badge'], [class*='pill'], [class*='Pill']", 40),
        tabs: texts("[role='tab'], [data-state]", 40),
        inputs: formControls,
        forms: document.querySelectorAll("form").length,
        sections: texts("main section, section, article", 40),
        emptyStates: texts("[role='status'], [role='alert'], [class*='empty'], [class*='Empty']", 25),
        bodyTextSample: compact(document.body?.innerText).slice(0, 1200),
        elementCounts: {
          buttons: document.querySelectorAll("button").length,
          links: document.querySelectorAll("a").length,
          cards: document.querySelectorAll("[class*='card'], .panel, section, article").length,
          inputs: document.querySelectorAll("input, textarea, select").length,
        },
      };
    });
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    result.status = "capture_error";
    result.error = messageOf(error);
  }

  return result;
}

function writeArtifact(payload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactPath = path.join(artifactRoot, `prototype-deep-analysis-${stamp}.json`);
  fs.writeFileSync(artifactPath, JSON.stringify(payload, null, 2));
  return artifactPath;
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

function isReachable(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.on("error", () => resolve(false));
    request.setTimeout(2_000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForReachable(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isReachable(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return false;
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (!(await isReachable(`http://127.0.0.1:${port}`))) return port;
  }
  throw new Error(`No hay puertos libres para analisis profundo desde ${startPort}.`);
}

function startDevServer(port) {
  const command = `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`;
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", command], {
      cwd: repoRoot,
      stdio: "ignore",
      env: { ...process.env, BROWSER: "none" },
    });
  }

  return spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: repoRoot,
    stdio: "ignore",
    env: { ...process.env, BROWSER: "none" },
  });
}

function stopProcessTree(child) {
  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}
