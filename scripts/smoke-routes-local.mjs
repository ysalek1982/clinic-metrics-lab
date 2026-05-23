import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { analyzeRouteSnapshot, sanitizeRouteName, scoreRouteSnapshot } from "./lib/smoke-detectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "smoke");
const screenshotDir = path.join(repoRoot, "artifacts", "screenshots", "smoke");
const docsDir = path.join(repoRoot, "docs");
const routes = [
  "/app",
  "/app/modules",
  "/app/module-settings",
  "/app/saas-admin",
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

const explicitBaseUrl = process.env.SMOKE_BASE_URL;
const fallbackPort = Number(process.env.SMOKE_PORT || 4314);
let baseUrl = explicitBaseUrl || `http://127.0.0.1:${fallbackPort}`;
const storageStatePath = process.env.SMOKE_STORAGE_STATE;
const hasStorageState = Boolean(storageStatePath && fs.existsSync(storageStatePath));
const startedServer = { process: null };

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  writeArtifact({
    status: "blocked",
    reason: "Playwright no esta disponible para smoke local.",
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(0);
}

try {
  if (!explicitBaseUrl) {
    const port = await findFreePort(fallbackPort);
    baseUrl = `http://127.0.0.1:${port}`;
    startedServer.process = startDevServer(port);
    await waitForReachable(baseUrl, 45_000);
  } else if (!(await isReachable(baseUrl))) {
    startedServer.process = startDevServer(Number(new URL(baseUrl).port || fallbackPort));
    await waitForReachable(baseUrl, 45_000);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(hasStorageState ? { storageState: storageStatePath } : {});
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const results = [];
  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    const routeErrorsStart = pageErrors.length;
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch((error) => ({ error }));
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);

    const bodyText = await page.locator("body").innerText({ timeout: 5_000 }).catch(() => "");
    const elementCount = await page.locator("body *").count().catch(() => 0);
    const visibleTitle = await page
      .locator("h1, h2, [data-page-title]")
      .first()
      .innerText({ timeout: 1_500 })
      .catch(() => "");
    const screenshotPath = path.join(screenshotDir, `${sanitizeRouteName(route)}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);

    const visibleButtons = await page
      .locator("button:visible, a:visible")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          text: (element.textContent || "").replace(/\s+/g, " ").trim(),
          disabled: element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true",
          ariaDisabled: element.getAttribute("aria-disabled") || "",
          title: element.getAttribute("title") || "",
          href: element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "",
          type: element instanceof HTMLButtonElement ? element.getAttribute("type") || "submit" : "",
          formAssociated: element instanceof HTMLButtonElement ? Boolean(element.form) : false,
          hasHandler:
            element.hasAttribute("data-testid") ||
            element.hasAttribute("onclick") ||
            element.getAttribute("role") === "button" ||
            element.tagName.toLowerCase() === "a",
        })),
      )
      .catch(() => []);

    const newPageErrors = pageErrors.slice(routeErrorsStart);
    const status = response?.status ? response.status() : response?.error ? "navigation_error" : "unknown";
    const { findings: criticalFindings, riskyButtons: fakeButtons } = analyzeRouteSnapshot({
      bodyText,
      elementCount,
        authenticated: hasStorageState,
        visibleButtons,
        pageErrors: newPageErrors,
      });
    const score = scoreRouteSnapshot({
      bodyText,
      elementCount,
      authenticated: hasStorageState,
      visibleButtons,
      pageErrors: newPageErrors,
    });

    results.push({
      route,
      finalUrl: page.url(),
      status,
      visibleTitle,
      textLength: bodyText.length,
      elementCount,
      criticalFindings,
      pageErrors: newPageErrors,
      fakeButtons,
      score,
      screenshotPath,
    });
  }

  await browser.close();

  const output = {
    status: results.some((result) => result.criticalFindings.length > 0) ? "failed" : "passed",
    baseUrl,
    authenticatedSmoke: hasStorageState,
    note: hasStorageState ? "Smoke autenticado ejecutado con storage state." : "Smoke autenticado no ejecutado por falta de sesion.",
    results,
  };
  const artifactPath = writeArtifact(output);
  const scoreArtifactPath = writeScoreArtifact(output);
  writeSummary(output, artifactPath);
  writeScoreSummary(output, scoreArtifactPath);
  console.log(`Smoke local: ${output.status}. Artifact: ${artifactPath}`);
  console.log(output.note);
  if (output.status === "failed") {
    process.exitCode = 1;
  }
} finally {
  if (startedServer.process) {
    stopProcessTree(startedServer.process);
  }
}

function writeArtifact(payload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(artifactDir, `smoke-routes-local-${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

function writeScoreArtifact(payload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(artifactDir, `smoke-routes-score-${stamp}.json`);
  const scorePayload = {
    generatedAt: new Date().toISOString(),
    baseUrl: payload.baseUrl,
    authenticatedSmoke: payload.authenticatedSmoke,
    routes: payload.results.map((result) => ({
      route: result.route,
      finalUrl: result.finalUrl,
      visibleTitle: result.visibleTitle,
      renderScore: result.score.renderScore,
      contentScore: result.score.contentScore,
      accessibilityScore: result.score.accessibilityScore,
      actionRiskScore: result.score.actionRiskScore,
      demoRisk: result.score.demoRisk,
      mojibakeRisk: result.score.mojibakeRisk,
      finalStatus: result.score.finalStatus,
      highRiskActions: result.score.highRiskActions.length,
      mediumRiskActions: result.score.mediumRiskActions.length,
      screenshotPath: result.screenshotPath,
    })),
  };
  fs.writeFileSync(filePath, JSON.stringify(scorePayload, null, 2));
  return filePath;
}

function writeSummary(output, artifactPath) {
  const rows = output.results
    .map(
      (result) =>
        `| \`${result.route}\` | ${result.status} | ${result.visibleTitle || "--"} | ${
          result.criticalFindings.length > 0 ? result.criticalFindings.join(", ") : "OK"
        } | \`${path.relative(repoRoot, result.screenshotPath).replace(/\\/g, "/")}\` |`,
    )
    .join("\n");
  const content = `# Smoke de rutas locales

Generado: ${new Date().toISOString()}

- Estado: ${output.status}
- Base URL: ${output.baseUrl}
- Smoke autenticado: ${output.authenticatedSmoke ? "si" : "no"}
- Nota: ${output.note}
- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`

| Ruta | HTTP | Titulo visible | Hallazgos | Screenshot |
|---|---:|---|---|---|
${rows}
`;
  fs.writeFileSync(path.join(docsDir, "smoke-routes-summary.md"), content);
}

function writeScoreSummary(output, artifactPath) {
  const rows = output.results
    .map(
      (result) =>
        `| \`${result.route}\` | ${result.score.renderScore} | ${result.score.contentScore} | ${result.score.accessibilityScore} | ${result.score.actionRiskScore} | ${result.score.demoRisk} | ${result.score.mojibakeRisk} | ${result.score.finalStatus} |`,
    )
    .join("\n");
  const content = `# Score local de rutas

Generado: ${new Date().toISOString()}

- Base URL: ${output.baseUrl}
- Smoke autenticado: ${output.authenticatedSmoke ? "si" : "no"}
- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`

| Ruta | Render | Contenido | Accesibilidad basica | Riesgo acciones | Demo | Mojibake | Estado |
|---|---:|---:|---:|---:|---|---|---|
${rows}
`;
  fs.writeFileSync(path.join(docsDir, "smoke-routes-score.md"), content);
}

function isReachable(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(url, (response) => {
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
    if (await isReachable(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error(`No se pudo iniciar servidor local para smoke en ${url}.`);
}

function stopProcessTree(child) {
  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
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

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (!(await isReachable(`http://127.0.0.1:${port}`))) return port;
  }
  throw new Error(`No hay puertos libres para smoke local desde ${startPort}.`);
}
