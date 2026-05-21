import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { classifyUiAction, isRiskyAction } from "./lib/smoke-detectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "ui-audit");
const docsDir = path.join(repoRoot, "docs");
const explicitBaseUrl = process.env.UI_AUDIT_BASE_URL;
let baseUrl = explicitBaseUrl || "http://127.0.0.1:4315";
const routes = [
  "/app",
  "/app/modules",
  "/app/module-settings",
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
const startedServer = { process: null };

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  writeArtifact({ status: "blocked", reason: "Playwright no disponible", error: messageOf(error) });
  process.exit(0);
}

try {
  if (!explicitBaseUrl) {
    const port = await findFreePort(Number(new URL(baseUrl).port || 4175));
    baseUrl = `http://127.0.0.1:${port}`;
    startedServer.process = startDevServer(port);
    await waitForReachable(baseUrl, 45_000);
  } else if (!(await isReachable(baseUrl))) {
    const port = Number(new URL(baseUrl).port || 4175);
    startedServer.process = startDevServer(port);
    await waitForReachable(baseUrl, 45_000);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const routeResults = [];

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    const actions = await page
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
          testId: element.getAttribute("data-testid") || "",
          hasHandler:
            element.hasAttribute("data-testid") ||
            element.hasAttribute("onclick") ||
            element.getAttribute("role") === "button" ||
            element.tagName.toLowerCase() === "a",
        })),
      )
      .catch(() => []);
    const classifiedActions = actions.map((action) => ({ ...action, classification: classifyUiAction(action) }));
    const highRiskActions = classifiedActions.filter((action) => action.classification.risk === "high");
    const mediumRiskActions = classifiedActions.filter((action) => action.classification.risk === "medium");
    const upcomingActions = classifiedActions.filter((action) => action.classification.kind === "limited");
    routeResults.push({
      route,
      finalUrl: page.url(),
      actionCount: actions.length,
      highRiskActions,
      mediumRiskActions,
      upcomingActions,
      classifiedActions,
      riskyActions: actions.filter(isRiskyAction),
      safeActions: actions.filter((action) => !isRiskyAction(action)).slice(0, 30),
    });
  }

  await browser.close();
  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    status: routeResults.some((result) => result.highRiskActions.length > 0) ? "review_required" : "passed",
    routeResults,
  };
  const artifactPath = writeArtifact(output);
  writeDoc(output, artifactPath);
  console.log(`Auditoria UI actions: ${output.status}. Artifact: ${artifactPath}`);
} finally {
  if (startedServer.process) stopProcessTree(startedServer.process);
}

function writeArtifact(payload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(artifactDir, `ui-actions-${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

function writeDoc(output, artifactPath) {
  const rows = output.routeResults
    .map(
      (result) =>
        `| \`${result.route}\` | ${result.actionCount} | ${result.highRiskActions.length} | ${result.mediumRiskActions.length} | ${result.upcomingActions.length} | ${
          result.highRiskActions.length > 0
            ? result.highRiskActions.map((item) => item.text || item.href).join("; ")
            : result.mediumRiskActions.length > 0
              ? "Revisar medios"
              : "OK"
        } |`,
    )
    .join("\n");
  fs.writeFileSync(
    path.join(docsDir, "ui-actions-audit.md"),
    `# Auditoria local de acciones UI

Generado: ${output.generatedAt}

- Estado: ${output.status}
- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`
- Nota: si no hay storage state autenticado, varias rutas pueden renderizar login/forbidden en vez de la vista operativa.
- Base URL: \`${output.baseUrl}\`

| Ruta | Total acciones | Riesgos altos | Riesgos medios | Proximamente/limitadas | Estado |
|---|---:|---:|---:|---:|---|
${rows}
`,
  );
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
  throw new Error(`No se pudo iniciar servidor local para auditoria UI en ${url}.`);
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
  throw new Error(`No hay puertos libres para auditoria UI desde ${startPort}.`);
}

function stopProcessTree(child) {
  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}
