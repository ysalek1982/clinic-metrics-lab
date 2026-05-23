import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "plangate");
const docsDir = path.join(repoRoot, "docs");
const authDir = path.join(repoRoot, "playwright", ".auth");

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

const personas = {
  free: fs.existsSync(path.join(authDir, "marcela-free.json")),
  pro: fs.existsSync(path.join(authDir, "qa-pro.json")),
  clinic: fs.existsSync(path.join(authDir, "qa-clinic.json")),
  courtesy: fs.existsSync(path.join(authDir, "qa-courtesy.json")),
};

const modules = [
  "Reports",
  "Copilot",
  "Labs",
  "Foods",
  "Recipes",
  "WeeklyMenu",
  "PediatricCurves",
  "Somatocarta",
  "Enteral",
  "Parenteral",
  "UsersRoles",
  "Audit",
  "SaaS Admin",
];

const rows = modules.map((module) => ({
  module,
  free: personas.free ? "validar visual" : "pendiente storage marcela-free",
  pro: personas.pro ? "validar visual" : "pendiente storage qa-pro",
  clinicHospital: personas.clinic ? "validar visual" : "pendiente storage qa-clinic",
  courtesy: personas.courtesy ? "validar visual" : "pendiente storage qa-courtesy",
  result: Object.values(personas).every(Boolean) ? "ready_for_visual_run" : "blocked_by_storage_state",
}));

const payload = {
  generatedAt: new Date().toISOString(),
  status: rows.every((row) => row.result === "ready_for_visual_run") ? "ready" : "blocked",
  rows,
};

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactPath = path.join(artifactDir, `plangate-matrix-${stamp}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(payload, null, 2));

const tableRows = rows
  .map((row) => `| ${row.module} | ${row.free} | ${row.pro} | ${row.clinicHospital} | ${row.courtesy} | ${row.result} |`)
  .join("\n");

fs.writeFileSync(
  path.join(docsDir, "plangate-validation-matrix.md"),
  `# PlanGate validation matrix

Generado: ${payload.generatedAt}

Estado: ${payload.status}

Artifact: \`${path.relative(repoRoot, artifactPath).replace(/\\/g, "/")}\`

| Modulo | Free | Pro | Clinic/Hospital | Courtesy | Resultado |
|---|---|---|---|---|---|
${tableRows}

La matriz visual queda bloqueada hasta contar con storage states autenticados por plan. No se asume acceso premium sin prueba.
`,
);

console.log(`PlanGate matrix: ${payload.status}. Artifact: ${artifactPath}`);
