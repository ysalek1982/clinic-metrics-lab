import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedAt = new Date().toISOString();
const artifactDir = path.join(repoRoot, "artifacts", "e2e");
const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:8080";
const cockpitPath = "/app/pack/enteral/cockpit";
const storageStatePath = process.env.E2E_STORAGE_STATE || "playwright/.auth/e2e-hsm.json";

const checks = {
  e2eEmail: hasEnv("E2E_EMAIL") || hasEnv("QA_E2E_EMAIL"),
  e2ePassword: hasEnv("E2E_PASSWORD") || hasEnv("QA_E2E_PASSWORD"),
  playwrightInstalled: await canImportPlaywright(),
  serverAvailable: await isServerAvailable(baseUrl),
  cockpitRouteIncluded: fs.existsSync(path.join(repoRoot, "src", "pages", "app", "PackView.tsx")),
  storageStateIgnored: isIgnoredByGitignore(storageStatePath),
  artifactDestinationReady: ensureDir(artifactDir),
};

const missing = Object.entries(checks)
  .filter(([, value]) => !value)
  .map(([key]) => key);
const ready = missing.length === 0;

const artifact = {
  generatedAt,
  dryRun: true,
  ready,
  missing,
  baseUrl,
  cockpitPath,
  storageStatePath,
  checks,
  commandWouldRun: "node scripts/e2e-enteral-flow.mjs",
  expectedArtifacts: [
    "artifacts/e2e/enteral-f9i/result.json",
    "artifacts/e2e/enteral-f9i/*.png",
  ],
  expectedEvidence: [
    "UI crea plan enteral",
    "UI edita plan enteral",
    "UI registra log diario",
    "UI pausa y cierra plan",
    "API autenticada verifica filas y audit logs",
    "RLS anon validado",
  ],
  safeNotes: [
    "Dry-run no inicia sesion.",
    "Dry-run no imprime credenciales.",
    "E2E real no debe ejecutarse sin credenciales reales o storageState valido.",
  ],
};

const artifactPath = path.join(artifactDir, `enteral-dry-run-${stamp(generatedAt)}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), "utf8");

console.log("E2E Enteral dry-run");
console.log("No se imprimen valores sensibles.");
console.log(`Estado: ${ready ? "precondiciones listas" : "bloqueado o incompleto"}`);
if (missing.length > 0) console.log(`Faltan/no listo: ${missing.join(", ")}`);
console.log(`Ruta objetivo: ${baseUrl}${cockpitPath}`);
console.log("Comando real cuando este listo: node scripts/e2e-enteral-flow.mjs");
console.log(`Artifact: ${artifactPath}`);

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

async function canImportPlaywright() {
  try {
    await import("playwright");
    return true;
  } catch {
    try {
      await import("@playwright/test");
      return true;
    } catch {
      return false;
    }
  }
}

async function isServerAvailable(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

function isIgnoredByGitignore(value) {
  const gitignorePath = path.join(repoRoot, ".gitignore");
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  const normalized = value.replace(/\\/g, "/");
  return (
    gitignore.includes("playwright/.auth") ||
    gitignore.includes("storageState.json") ||
    gitignore.split(/\r?\n/).some((line) => line.trim() && normalized.includes(line.replace(/\/$/, "").trim()))
  );
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return fs.existsSync(dir);
}

function stamp(value) {
  return value.replace(/[:.]/g, "-");
}
