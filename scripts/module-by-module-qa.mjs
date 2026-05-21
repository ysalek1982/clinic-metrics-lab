import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  analyzeRouteSnapshot,
  classifyUiAction,
  detectMojibake,
  sanitizeRouteName,
  scoreRouteSnapshot,
} from "./lib/smoke-detectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "module-qa");
const screenshotDir = path.join(artifactDir, "screenshots");
const docsDir = path.join(repoRoot, "docs");
const explicitBaseUrl = process.env.MODULE_QA_BASE_URL;
let baseUrl = explicitBaseUrl || "http://127.0.0.1:4318";
const storageStatePath = process.env.MODULE_QA_STORAGE_STATE || process.env.SMOKE_STORAGE_STATE;
const authenticated = Boolean(storageStatePath && fs.existsSync(storageStatePath));
const startedServer = { process: null };

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

const routeFiles = {
  "/app": "src/pages/app/Dashboard.tsx",
  "/app/modules": "src/pages/app/ModulesCenter.tsx",
  "/app/module-settings": "src/pages/app/ModuleSettings.tsx",
  "/app/copilot": "src/pages/app/Copilot.tsx",
  "/app/patients": "src/pages/app/Patients.tsx",
  "/app/anthropometry": "src/pages/app/Anthropometry.tsx",
  "/app/screening": "src/pages/app/Screening.tsx",
  "/app/plans": "src/pages/app/Plans.tsx",
  "/app/agenda": "src/pages/app/Agenda.tsx",
  "/app/messages": "src/pages/app/Messages.tsx",
  "/app/alerts": "src/pages/app/Alerts.tsx",
  "/app/reports": "src/pages/app/Reports.tsx",
  "/app/labs": "src/pages/app/Labs.tsx",
  "/app/foods": "src/pages/app/Foods.tsx",
  "/app/recipes": "src/pages/app/Recipes.tsx",
  "/app/weekly-menu": "src/pages/app/WeeklyMenu.tsx",
  "/app/pediatric-curves": "src/pages/app/PediatricCurves.tsx",
  "/app/pack/enteral/cockpit": "src/pages/app/pack-modules/EnteralCockpit.tsx",
  "/app/pack/parenteral": "src/pages/app/pack-modules/ParenteralBase.tsx",
  "/app/somatocarta": "src/pages/app/pack-modules/SportSomatocarta.tsx",
  "/app/users": "src/pages/app/UsersRoles.tsx",
  "/app/audit": "src/pages/app/Audit.tsx",
  "/app/settings": "src/pages/app/InstitutionSettings.tsx",
  "/app/organization": "src/pages/app/Organization.tsx",
};

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  const artifactPath = writeArtifact({
    status: "blocked",
    reason: "Playwright no esta disponible para QA modulo por modulo.",
    error: messageOf(error),
  });
  writeDoc({ status: "blocked", results: [], artifactPath, note: "Playwright no disponible." });
  process.exit(0);
}

try {
  if (!explicitBaseUrl) {
    const port = await findFreePort(Number(new URL(baseUrl).port || 4318));
    baseUrl = `http://127.0.0.1:${port}`;
    startedServer.process = startDevServer(port);
    await waitForReachable(baseUrl, 45_000);
  } else if (!(await isReachable(baseUrl))) {
    startedServer.process = startDevServer(Number(new URL(baseUrl).port || 4318));
    await waitForReachable(baseUrl, 45_000);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(authenticated ? { storageState: storageStatePath } : {});
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const results = [];
  for (const route of routes) {
    const routeErrorsStart = pageErrors.length;
    const screenshotPath = path.join(screenshotDir, `${sanitizeRouteName(route)}.png`);
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch((error) => ({ error }));
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);

    const bodyText = await page.locator("body").innerText({ timeout: 5_000 }).catch(() => "");
    const elementCount = await page.locator("body *").count().catch(() => 0);
    const visibleTitle = await page.locator("h1, h2, [data-page-title]").first().innerText({ timeout: 1_500 }).catch(() => "");
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);

    const visibleActions = await page
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

    const forms = await page
      .locator("form")
      .evaluateAll((elements) =>
        elements.map((form) => ({
          text: (form.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
          hasSubmit: Boolean(form.querySelector('button[type="submit"], input[type="submit"]')),
          inputCount: form.querySelectorAll("input, select, textarea").length,
        })),
      )
      .catch(() => []);

    const dialogs = await page
      .locator('[role="dialog"], [data-radix-dialog-content], [data-vaul-drawer]')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120),
            visible: rect.width > 0 && rect.height > 0,
            overflowsViewport: rect.right > window.innerWidth + 8 || rect.bottom > window.innerHeight + 8 || rect.left < -8,
            hasScrollableContent: element.scrollHeight > element.clientHeight,
          };
        }),
      )
      .catch(() => []);

    const staticFindings = inspectSource(routeFiles[route]);
    const newPageErrors = pageErrors.slice(routeErrorsStart);
    const classifiedActions = visibleActions.map((action) => ({ ...action, classification: classifyUiAction(action) }));
    const snapshot = analyzeRouteSnapshot({
      bodyText,
      elementCount,
      visibleButtons: visibleActions,
      authenticated,
      pageErrors: newPageErrors,
    });
    const score = scoreRouteSnapshot({
      bodyText,
      elementCount,
      visibleButtons: visibleActions,
      authenticated,
      pageErrors: newPageErrors,
    });
    const findings = [
      ...snapshot.findings,
      ...staticFindings,
      forms.some((form) => form.inputCount > 0 && !form.hasSubmit) ? "formulario_sin_submit_visible" : null,
      dialogs.some((dialog) => dialog.visible && dialog.overflowsViewport) ? "dialog_fuera_de_layout" : null,
      /\bNaN\b|\bundefined\b|\bnull\b/i.test(bodyText) ? "valor_null_undefined_nan_visible" : null,
      hasEnglishUi(bodyText) ? "posible_texto_ingles" : null,
      missingEmptyState(bodyText) ? "sin_empty_state_evidente" : null,
    ].filter(Boolean);

    const isAuthGate = !authenticated && (/acceso seguro|iniciar sesi[oó]n|correo electr[oó]nico/i.test(bodyText) || page.url().includes("/login"));
    const filteredFindings = isAuthGate ? findings.filter((item) => item !== "sin_empty_state_evidente") : findings;
    const severity = isAuthGate
      ? "AUTH_REQUIRED"
      : filteredFindings.some((item) =>
          [
            "pantalla_vacia",
            "error_boundary_visible",
            "undefined_data_visible",
            "pageerror",
            "native_popup",
            "window_open",
            "demo_autenticado_visible",
            "service_role_frontend",
          ].includes(item),
        )
        ? "P0"
        : filteredFindings.some((item) =>
          [
            "botones_riesgo_visibles",
            "dialog_fuera_de_layout",
            "formulario_sin_submit_visible",
            "valor_null_undefined_nan_visible",
            "href_hash",
            "permiso_dudoso",
          ].includes(item),
        )
        ? "P1"
        : filteredFindings.length > 0
          ? "P2"
          : "OK";

    results.push({
      route,
      sourceFile: routeFiles[route],
      finalUrl: page.url(),
      status: response?.status ? response.status() : response?.error ? "navigation_error" : "unknown",
      visibleTitle,
      textLength: bodyText.length,
      elementCount,
      authenticated,
      findings: [...new Set(isAuthGate ? ["auth_required_sin_storage_state", ...filteredFindings] : filteredFindings)],
      severity,
      pageErrors: newPageErrors,
      forms,
      dialogs,
      highRiskActions: classifiedActions.filter((action) => action.classification.risk === "high"),
      mediumRiskActions: classifiedActions.filter((action) => action.classification.risk === "medium"),
      upcomingActions: classifiedActions.filter((action) => action.classification.kind === "limited"),
      score,
      screenshotPath,
    });
  }

  await browser.close();
  const status = results.some((result) => result.severity === "P0") ? "failed" : results.some((result) => result.severity === "P1") ? "review_required" : "passed";
  const artifactPath = writeArtifact({
    generatedAt: new Date().toISOString(),
    baseUrl,
    authenticated,
    status,
    results,
  });
  writeDoc({ status, results, artifactPath, note: authenticated ? "QA autenticado con storage state." : "QA autenticado no ejecutado por falta de storage state." });
  console.log(`QA modulo por modulo: ${status}. Artifact: ${artifactPath}`);
  if (status === "failed") process.exitCode = 1;
} finally {
  if (startedServer.process) stopProcessTree(startedServer.process);
}

function inspectSource(relativeFile) {
  if (!relativeFile) return [];
  const filePath = path.join(repoRoot, relativeFile);
  if (!fs.existsSync(filePath)) return ["archivo_fuente_no_encontrado"];
  const source = fs.readFileSync(filePath, "utf8");
  return [
    /window\.open/.test(source) ? "window_open" : null,
    /\b(alert|confirm|prompt)\s*\(/.test(source) ? "native_popup" : null,
    /href=["']#["']/.test(source) ? "href_hash" : null,
    /service_role|SUPABASE_SERVICE_ROLE/i.test(source) ? "service_role_frontend" : null,
    /src\/data\/(demo|saas|clinical)|source:\s*["']demo["']/.test(source) ? "demo_source_reference" : null,
    detectMojibake(source) ? "mojibake_en_fuente" : null,
    /onClick=\{[^}]*\b(delete|remove|close|cancel|pause|resolver|silenciar|cerrar|pausar)/i.test(source) &&
    !/ActionDialog|AlertDialog|Dialog|Sheet/.test(source)
      ? "accion_sensible_sin_popup_evidente"
      : null,
  ].filter(Boolean);
}

function hasEnglishUi(text) {
  const sample = text ?? "";
  return /\b(loading|save|cancel|delete|edit|create|submit|error|settings|users)\b/.test(sample) && !/No se pudo|Guardar|Cancelar|Editar|Configuracion|Usuarios/i.test(sample);
}

function missingEmptyState(text) {
  const sample = text ?? "";
  if (/login|iniciar sesion|correo/i.test(sample)) return false;
  return !/no hay|sin datos|aun no|empty|selecciona|proximamente|bloqueado|permiso|cargando/i.test(sample) && sample.length > 180;
}

function writeArtifact(payload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(artifactDir, `module-qa-${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

function writeDoc({ status, results, artifactPath, note }) {
  const rows = results
    .map(
      (result) =>
        `| \`${result.route}\` | ${result.severity} | ${result.visibleTitle || "--"} | ${
          result.findings.length > 0 ? result.findings.join(", ") : "OK"
        } | ${result.highRiskActions.length}/${result.mediumRiskActions.length} | \`${path.relative(repoRoot, result.screenshotPath).replace(/\\/g, "/")}\` |`,
    )
    .join("\n");
  const content = `# QA modulo por modulo

Generado: ${new Date().toISOString()}

- Estado: ${status}
- Base URL: \`${baseUrl}\`
- Autenticado: ${authenticated ? "si" : "no"}
- Nota: ${note}
- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`

| Ruta | Severidad | Titulo visible | Hallazgos | Acciones alto/medio | Screenshot |
|---|---|---|---|---:|---|
${rows}
`;
  fs.writeFileSync(path.join(docsDir, "module-by-module-qa.md"), content);
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
  throw new Error(`No se pudo iniciar servidor local para QA modulo por modulo en ${url}.`);
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (!(await isReachable(`http://127.0.0.1:${port}`))) return port;
  }
  throw new Error(`No hay puertos libres para QA modulo por modulo desde ${startPort}.`);
}

function startDevServer(port) {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", `npm.cmd run dev -- --host 127.0.0.1 --port ${port} --strictPort`], {
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

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
