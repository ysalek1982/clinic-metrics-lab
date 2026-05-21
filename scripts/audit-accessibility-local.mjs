import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "accessibility");
const docsDir = path.join(repoRoot, "docs");
const baseUrl = process.env.A11Y_BASE_URL || "http://127.0.0.1:4176";
const routes = [
  "/app",
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

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

let chromium;
let server = null;
try {
  ({ chromium } = await import("@playwright/test"));
} catch (error) {
  const artifactPath = writeArtifact({ status: "blocked", reason: "Playwright no disponible", error: messageOf(error) });
  writeDoc({ status: "blocked", routes: [], artifactPath });
  process.exit(0);
}

try {
  if (!(await isReachable(baseUrl))) {
    server = startDevServer(Number(new URL(baseUrl).port || 4176));
    await waitForReachable(baseUrl, 45_000);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    const findings = await page.evaluate(() => {
      const byText = (node) => (node.textContent || "").replace(/\s+/g, " ").trim();
      const accessible = (node) => byText(node) || node.getAttribute("aria-label") || node.getAttribute("title") || "";
      const inputHasLabel = (node) => {
        const id = node.getAttribute("id");
        return Boolean(
          node.getAttribute("aria-label") ||
            node.getAttribute("aria-labelledby") ||
            node.getAttribute("placeholder") ||
            (id && document.querySelector(`label[for="${id}"]`)) ||
            node.closest("label"),
        );
      };
      const rows = [];
      document.querySelectorAll("button").forEach((node) => {
        if (!accessible(node)) rows.push({ type: "button_no_name", sample: byText(node).slice(0, 80) });
      });
      document.querySelectorAll("a").forEach((node) => {
        if (!accessible(node)) rows.push({ type: "link_no_name", sample: node.getAttribute("href") || "" });
      });
      document.querySelectorAll("input, select, textarea").forEach((node) => {
        if (!inputHasLabel(node)) rows.push({ type: "field_no_label", sample: node.getAttribute("name") || node.getAttribute("type") || node.tagName });
      });
      document.querySelectorAll("img").forEach((node) => {
        if (!node.hasAttribute("alt")) rows.push({ type: "image_no_alt", sample: node.getAttribute("src") || "" });
      });
      document.querySelectorAll('[role="dialog"], [data-radix-dialog-content]').forEach((node) => {
        if (!node.getAttribute("aria-label") && !node.getAttribute("aria-labelledby") && !node.querySelector("h1,h2,h3")) {
          rows.push({ type: "dialog_no_title", sample: byText(node).slice(0, 80) });
        }
      });
      return rows;
    });
    results.push({ route, finalUrl: page.url(), findings });
  }

  await browser.close();
  const status = results.some((route) => route.findings.length > 0) ? "review_required" : "passed";
  const artifactPath = writeArtifact({ generatedAt: new Date().toISOString(), status, baseUrl, routes: results });
  writeDoc({ status, routes: results, artifactPath });
  console.log(`Accessibility audit: ${status}. Artifact: ${artifactPath}`);
} finally {
  if (server) stopProcessTree(server);
}

function writeArtifact(payload) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(artifactDir, `accessibility-audit-${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  return filePath;
}

function writeDoc({ status, routes, artifactPath }) {
  const rows = routes
    .map((route) => `| \`${route.route}\` | ${route.findings.length} | ${route.findings.map((item) => item.type).join(", ") || "OK"} |`)
    .join("\n");
  fs.writeFileSync(
    path.join(docsDir, "accessibility-audit.md"),
    `# Auditoria local de accesibilidad basica

Generado: ${new Date().toISOString()}

- Estado: ${status}
- Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`
- Alcance: heuristicas locales, no certificacion WCAG completa.

| Ruta | Hallazgos | Tipos |
|---|---:|---|
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
  throw new Error(`No se pudo iniciar servidor local para auditoria accesibilidad en ${url}.`);
}

function startDevServer(port) {
  const command = `npm run dev -- --host 127.0.0.1 --port ${port}`;
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", command], { cwd: repoRoot, stdio: "ignore", env: { ...process.env, BROWSER: "none" } });
  }
  return spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)], {
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
