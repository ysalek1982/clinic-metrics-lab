import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "security");
const docsDir = path.join(repoRoot, "docs");
const authDir = path.join(repoRoot, "playwright", ".auth");

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const requiredStates = [
  { persona: "ysalek", file: "ysalek.json", purpose: "platform admin" },
  { persona: "marcela-free", file: "marcela-free.json", purpose: "free non-admin" },
  { persona: "qa-pro", file: "qa-pro.json", purpose: "pro non-platform" },
  { persona: "qa-clinic", file: "qa-clinic.json", purpose: "clinic tenant admin" },
  { persona: "qa-courtesy", file: "qa-courtesy.json", purpose: "courtesy time-limited" },
  { persona: "qa-no-membership", file: "qa-no-membership.json", purpose: "authenticated without membership" },
];

const checks = requiredStates.map((state) => {
  const exists = fs.existsSync(path.join(authDir, state.file));
  return {
    persona: state.persona,
    purpose: state.purpose,
    storageState: `playwright/.auth/${state.file}`,
    status: exists ? "ready" : "blocked",
    pending: exists ? "" : "storage state ausente; generar con scripts/create-auth-storage-states.mjs o login manual",
  };
});

const status = checks.every((check) => check.status === "ready") ? "ready" : "blocked";
const payload = {
  generatedAt: new Date().toISOString(),
  status,
  scope: "QA Seguridad P0 real requiere sesiones autenticadas reales; este script no usa secretos ni crea usuarios.",
  checks,
  controls: [
    "anon no lee tablas privadas",
    "anon no ejecuta RPC admin",
    "free no administra ni accede premium critico",
    "pro no administra plataforma",
    "clinic no cruza tenants",
    "courtesy muestra vencimiento",
    "sin membership no entra al sistema completo",
  ],
};

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactPath = path.join(artifactDir, `qa-security-p0-real-${stamp}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(payload, null, 2));

const rows = checks
  .map((check) => `| ${check.persona} | ${check.purpose} | ${check.status} | ${check.pending || "Listo para ejecutar control real"} |`)
  .join("\n");

fs.writeFileSync(
  path.join(docsDir, "qa-security-p0-real.md"),
  `# QA Seguridad P0 real

Generado: ${payload.generatedAt}

Estado: ${status}

Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`

| Persona | Proposito | Estado | Pendiente |
|---|---|---|---|
${rows}

Este documento no cierra QA P0. Solo deja evidencia de precondiciones y faltantes sin imprimir secretos.
`,
);

console.log(`QA Seguridad P0 real: ${status}. Artifact: ${artifactPath}`);
