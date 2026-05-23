import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sanitizeRouteName } from "./lib/smoke-detectors.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const prototypeBase = "https://preview--clinic-metrics-lab.lovable.app";
const explicitNutriBase = process.env.PARITY_NUTRI_URL;
let nutriBase = explicitNutriBase || "http://127.0.0.1:4316";
const artifactRoot = path.join(repoRoot, "artifacts", "visual-parity");
const prototypeDir = path.join(artifactRoot, "prototype");
const nutriDir = path.join(artifactRoot, "nutri");
const docsDir = path.join(repoRoot, "docs");
const startedServer = { process: null };

const prototypeRoutes = [
  "/app",
  "/app/copilot",
  "/app/patients",
  "/app/anthropometry",
  "/app/labs",
  "/app/reports",
  "/app/foods",
  "/app/recipes",
  "/app/weekly-menu",
  "/app/pediatric-curves",
];

const nutriRoutes = [
  "/app",
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

fs.mkdirSync(prototypeDir, { recursive: true });
fs.mkdirSync(nutriDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  writeDoc([], [], `Playwright no esta disponible: ${messageOf(error)}`);
  process.exit(0);
}

try {
  if (!explicitNutriBase) {
    const port = await findFreePort(Number(new URL(nutriBase).port || 4316));
    nutriBase = `http://127.0.0.1:${port}`;
    startedServer.process = startDevServer(port);
    await waitForReachable(nutriBase, 45_000).catch(() => undefined);
  } else if (!(await isReachable(nutriBase))) {
    startedServer.process = startDevServer(Number(new URL(nutriBase).port || 4316));
    await waitForReachable(nutriBase, 45_000).catch(() => undefined);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  const prototypeResults = [];
  for (const route of prototypeRoutes) {
    prototypeResults.push(await captureRoute(page, prototypeBase, route, prototypeDir));
  }

  const nutriResults = [];
  for (const route of nutriRoutes) {
    nutriResults.push(await captureRoute(page, nutriBase, route, nutriDir));
  }

  await browser.close();

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactPath = path.join(artifactRoot, `prototype-parity-${stamp}.json`);
  fs.writeFileSync(artifactPath, JSON.stringify({ generatedAt: new Date().toISOString(), prototypeResults, nutriResults }, null, 2));
  writeDoc(prototypeResults, nutriResults, null, artifactPath);
  console.log(`Paridad visual capturada. Artifact: ${artifactPath}`);
} finally {
  if (startedServer.process) stopProcessTree(startedServer.process);
}

async function captureRoute(page, baseUrl, route, targetDir) {
  const url = `${baseUrl}${route}`;
  const filePath = path.join(targetDir, `${sanitizeRouteName(route)}.png`);
  const startedAt = Date.now();
  const result = {
    route,
    url,
    screenshotPath: filePath,
    status: "unknown",
    finalUrl: null,
    title: "",
    textSample: "",
    error: null,
    elapsedMs: null,
  };

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    result.status = response ? String(response.status()) : "no_response";
    result.finalUrl = page.url();
    result.title = await page.locator("h1, h2").first().innerText({ timeout: 1_500 }).catch(() => "");
    result.textSample = (await page.locator("body").innerText({ timeout: 3_000 }).catch(() => "")).slice(0, 240);
    await page.screenshot({ path: filePath, fullPage: true });
  } catch (error) {
    result.status = "capture_error";
    result.error = messageOf(error);
  } finally {
    result.elapsedMs = Date.now() - startedAt;
  }

  return result;
}

function writeDoc(prototypeResults, nutriResults, setupError, artifactPath = null) {
  const row = (screen, prototypeNote, nutriNote, gap, action, status) =>
    `| ${screen} | ${prototypeNote} | ${nutriNote} | ${gap} | ${action} | ${status} |`;

  const rows = [
    row(
      "Dashboard",
      observed(prototypeResults, "/app", "Shell oscuro tipo command center"),
      observed(nutriResults, "/app", "Centro de mando real/fallback controlado"),
      "Afinar jerarquia de KPIs y densidad segun screenshots autenticados.",
      "Mantener cards premium y datos reales.",
      "Media-alta",
    ),
    row("Pacientes", observed(prototypeResults, "/app/patients", "Tabla/listado clinico"), observed(nutriResults, "/app/patients", "Tabla clinica con filtros"), "Validar densidad en sesion autenticada.", "Smoke autenticado pendiente.", "Media"),
    row("Antropometría", observed(prototypeResults, "/app/anthropometry", "Estacion antropometrica"), observed(nutriResults, "/app/anthropometry", "Estacion real con estados visibles"), "Comparar paneles laterales con sesion.", "No mover calculos a React.", "Media"),
    row("Labs", observed(prototypeResults, "/app/labs", "Panel de marcadores"), observed(nutriResults, "/app/labs", "Labs reales y tres columnas"), "Micro-ajustes visuales menores.", "Mantener interpretacion real.", "Alta"),
    row("Reportes", observed(prototypeResults, "/app/reports", "Galeria de reportes"), observed(nutriResults, "/app/reports", "Reportes reales/export inicial"), "`report.exported` sigue sin evidencia autenticada.", "No cerrar Fase 18A.", "Media"),
    row("Nutrición operativa", "Biblioteca/constructor/matriz", "Foods/recipes/weekly-menu funcionales", "Validar paridad visual autenticada.", "Mantener calculos en dominio.", "Alta"),
    row("Pediatría", observed(prototypeResults, "/app/pediatric-curves", "Curvas pediátricas visuales"), observed(nutriResults, "/app/pediatric-curves", "Referencia incompleta controlada"), "Faltan CSV WHO/OMS.", "No inventar z-score/percentil.", "Bloqueada"),
    row("Enteral/Parenteral", "No siempre visible en prototipo publico", "Cockpit/base controlada reales", "E2E autenticado pendiente.", "No marcar parenteral avanzado.", "Media"),
    row("Usuarios/Auditoría", "No prioritario en prototipo visual", "Admin real y audit trail", "Depende de credenciales para QA.", "Mantener service role fuera de frontend.", "Media"),
  ].join("\n");

  const content = `# Auditoría de paridad visual con prototipo

Generado: ${new Date().toISOString()}

- Prototipo: ${prototypeBase}/app
- Nutri local: ${nutriBase}/app
- Artifact JSON: ${artifactPath ? `\`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`` : "No generado"}
- Error de setup: ${setupError ?? "ninguno"}

Esta auditoría usa el prototipo como referencia visual/interactiva. No copia datos demo ni reemplaza fuentes Supabase reales.

| Pantalla | Prototipo observado | Nutri actual | Brecha visual/UX | Acción recomendada | Estado |
|---|---|---|---|---|---|
${rows}

## Criterios visuales revisados

- Sidebar y topbar oscuros, densos y editoriales.
- Cards con borde fino, jerarquía compacta y acento cian.
- Tablas clínicas densas pero legibles.
- Empty/error/forbidden honestos.
- Botones no implementados deshabilitados o marcados como Próximamente.
- Sin datos demo autenticados.
`;
  fs.writeFileSync(path.join(docsDir, "prototype-parity-audit.md"), content);
}

function observed(results, route, fallback) {
  const found = results.find((result) => result.route === route);
  if (!found) return fallback;
  if (found.error) return `No capturado (${found.error})`;
  return found.title || fallback;
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
  throw new Error(`No hay puertos libres para paridad visual desde ${startPort}.`);
}

function stopProcessTree(child) {
  if (process.platform === "win32" && child.pid) {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}
