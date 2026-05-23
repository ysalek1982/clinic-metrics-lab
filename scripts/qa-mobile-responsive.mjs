import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "mobile");
const baseUrl = process.env.MOBILE_QA_BASE_URL || process.env.E2E_BASE_URL || "https://clinic-metrics-lab.vercel.app";

fs.mkdirSync(artifactDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const result = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  viewports: [],
  checks: [],
  summary: { passed: 0, failed: 0, skipped: 0 },
};

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 768 },
];

const personas = [
  {
    name: "marcela-free",
    storage: path.join(repoRoot, "playwright", ".auth", "marcela-free.json"),
    routes: [
      "/app",
      "/app/account",
      "/app/modules",
      "/app/organization",
      "/app/users",
      "/app/audit",
      "/app/saas-admin",
      "/app/pack/enteral/cockpit",
      "/app/pack/parenteral",
    ],
  },
  {
    name: "qa-clinic",
    storage: path.join(repoRoot, "playwright", ".auth", "qa-clinic.json"),
    routes: [
      "/app",
      "/app/account",
      "/app/patients",
      "/app/reports",
      "/app/agenda",
      "/app/alerts",
      "/app/recipes",
      "/app/weekly-menu",
      "/app/pack/enteral/cockpit",
      "/app/pack/parenteral",
      "/app/modules",
      "/app/organization",
      "/app/users",
      "/app/audit",
    ],
  },
  {
    name: "ysalek",
    storage: path.join(repoRoot, "playwright", ".auth", "ysalek.json"),
    routes: ["/app", "/app/saas-admin", "/app/modules", "/app/audit"],
  },
];

const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    result.viewports.push(viewport);
    for (const theme of ["light", "dark"]) {
      for (const persona of personas) {
        await runPersonaViewport(persona, viewport, theme);
      }
    }
  }
} finally {
  await browser.close();
}

writeResult();

if (result.summary.failed > 0) {
  console.error(`QA mobile responsive: failed (${result.summary.failed}). Artifact: ${artifactPath()}`);
  process.exit(1);
}

console.log(`QA mobile responsive: passed. Artifact: ${artifactPath()}`);

async function runPersonaViewport(persona, viewport, theme) {
  if (!fs.existsSync(persona.storage)) {
    for (const route of persona.routes) {
      record({ persona: persona.name, viewport: viewport.name, theme, route, status: "skipped", reason: "missing storage state" });
    }
    return;
  }

  const context = await browser.newContext({
    storageState: persona.storage,
    viewport: { width: viewport.width, height: viewport.height },
  });
  await context.addInitScript((mode) => {
    window.localStorage.setItem("nutri.theme", mode);
  }, theme);
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  try {
    for (const route of persona.routes) {
      await checkRoute(page, persona.name, viewport, theme, route, runtimeErrors);
      runtimeErrors.length = 0;
    }
  } finally {
    await context.close();
  }
}

async function checkRoute(page, persona, viewport, theme, route, runtimeErrors) {
  const startedAt = Date.now();
  const check = {
    persona,
    viewport: viewport.name,
    theme,
    route,
    status: "passed",
    finalUrl: null,
    bodyLength: 0,
    overflowX: 0,
    themeResolved: null,
    findings: [],
    warnings: [],
  };

  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
    check.finalUrl = new URL(page.url()).pathname;

    const metrics = await page.evaluate(() => {
      const bodyText = document.body.innerText || "";
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const visibleButtons = Array.from(document.querySelectorAll("button"))
        .slice(0, 50)
        .map((button) => {
          const rect = button.getBoundingClientRect();
          const label = button.textContent?.trim() || button.getAttribute("aria-label") || "button";
          return {
            label,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0,
          };
        });
      return {
        bodyText,
        scrollWidth,
        clientWidth,
        theme: document.documentElement.dataset.theme || "",
        themeMode: document.documentElement.dataset.themeMode || "",
        visibleButtons,
      };
    });

    check.bodyLength = metrics.bodyText.length;
    check.overflowX = Math.max(0, metrics.scrollWidth - metrics.clientWidth);
    check.themeResolved = metrics.theme;

    if (page.url().includes("/login")) {
      check.findings.push("redirected_to_login");
    }
    if (metrics.bodyText.trim().length < 40) {
      check.findings.push("body_too_short");
    }
    if (/Application error|ErrorBoundary|Cannot read properties|TypeError:|ReferenceError:/i.test(metrics.bodyText)) {
      check.findings.push("runtime_error_text");
    }
    if (runtimeErrors.length > 0) {
      check.findings.push(`page_errors:${runtimeErrors.slice(0, 3).join(" | ")}`);
    }
    if (check.overflowX > 24) {
      check.findings.push(`horizontal_overflow:${check.overflowX}`);
    }
    if (metrics.theme !== theme) {
      check.findings.push(`theme_not_applied:${metrics.theme || "empty"}`);
    }

    const offscreenButtons = metrics.visibleButtons.filter(
      (button) => button.visible && (button.right > viewport.width + 24 || button.left < -24),
    );
    if (offscreenButtons.length > 0 && check.overflowX > 24) {
      check.findings.push(`offscreen_buttons:${offscreenButtons.slice(0, 3).map((button) => button.label).join(",")}`);
    } else if (offscreenButtons.length > 0) {
      check.warnings.push(`offscreen_buttons_in_internal_scroll:${offscreenButtons.slice(0, 3).map((button) => button.label).join(",")}`);
    }

    if (check.findings.length > 0) {
      check.status = "failed";
      await page
        .screenshot({
          path: path.join(artifactDir, `${timestamp}-${persona}-${viewport.name}-${theme}-${sanitize(route)}.png`),
          fullPage: true,
        })
        .catch(() => undefined);
    }
  } catch (error) {
    check.status = "failed";
    check.findings.push(error instanceof Error ? error.message : String(error));
    await page
      .screenshot({
        path: path.join(artifactDir, `${timestamp}-${persona}-${viewport.name}-${theme}-${sanitize(route)}-exception.png`),
        fullPage: true,
      })
      .catch(() => undefined);
  } finally {
    check.durationMs = Date.now() - startedAt;
    record(check);
  }
}

function record(check) {
  result.checks.push(check);
  if (check.status === "passed") result.summary.passed += 1;
  else if (check.status === "skipped") result.summary.skipped += 1;
  else result.summary.failed += 1;
}

function sanitize(route) {
  return route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "") || "root";
}

function artifactPath() {
  return path.join(artifactDir, `mobile-responsive-${timestamp}.json`);
}

function writeResult() {
  fs.writeFileSync(artifactPath(), `${JSON.stringify(result, null, 2)}\n`);
}
