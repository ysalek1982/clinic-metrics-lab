import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPermissionAction, detectPermissionAction, summarizePermissionActions } from "./lib/permission-gate-classifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "security");
const docsDir = path.join(repoRoot, "docs");
const scanRoots = ["src/pages", "src/components"];

const files = scanRoots.flatMap((root) => listFiles(path.join(repoRoot, root), /\.(tsx|ts)$/));
const actions = [];

for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!detectPermissionAction(line)) return;
    const start = Math.max(0, index - 8);
    const end = Math.min(lines.length, index + 9);
    const context = lines.slice(start, end).join("\n");
    const classification = classifyPermissionAction({ line, context });
    if (!classification) return;
    actions.push({
      file: path.relative(repoRoot, file).replace(/\\/g, "/"),
      line: index + 1,
      action: line.trim().slice(0, 180),
      ...classification,
    });
  });
}

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });
const artifactPath = path.join(artifactDir, `permission-gates-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
const summary = summarizePermissionActions(actions);
const findings = actions.filter((item) => item.requiresReview);
fs.writeFileSync(artifactPath, JSON.stringify({ generatedAt: new Date().toISOString(), summary, actions, findings }, null, 2));
writeDoc(artifactPath, actions);
console.log(`Permission gates audit: ${findings.length} hallazgo(s) para revision, ${actions.length} accion(es) clasificadas. Artifact: ${artifactPath}`);

function listFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, pattern);
    return pattern.test(full) ? [full] : [];
  });
}

function writeDoc(filePath, rows) {
  const summary = summarizePermissionActions(rows);
  const summaryRows = Object.entries(summary.byCategory)
    .map(([category, data]) => `| ${category} | ${data.total} | ${data.requiresReview} |`)
    .join("\n");
  const reviewRows = rows
    .filter((item) => item.requiresReview)
    .slice(0, 120)
    .map(
      (item) =>
        `| \`${item.file}:${item.line}\` | ${item.severity} | ${item.category} | ${item.reason} | \`${item.action.replaceAll("|", "\\|")}\` | Revisar guard UI; RLS sigue siendo control final |`,
    )
    .join("\n");
  const protectedRows = rows
    .filter((item) => !item.requiresReview)
    .slice(0, 80)
    .map(
      (item) =>
        `| \`${item.file}:${item.line}\` | ${item.category} | ${item.severity} | \`${item.action.replaceAll("|", "\\|")}\` |`,
    )
    .join("\n");
  fs.writeFileSync(
    path.join(docsDir, "permission-gates-audit.md"),
    `# Auditoria local de permission gates

Generado: ${new Date().toISOString()}

- Artifact: \`${path.relative(repoRoot, filePath).replace(/\\/g, "/")}\`
- Alcance: heuristica estatica sobre UI. Un hallazgo no implica fuga; indica revision manual.
- Estado: ${summary.critical} criticos, ${summary.requiresReview} para revision.
- Accion Macrofase 29: el auditor tambien clasifica acciones protegidas, limitadas, proximamente y dependientes de backend/RLS.

| Categoria | Total | Requiere revision |
|---|---:|---:|
${summaryRows || "| -- | 0 | 0 |"}

## Acciones para revision

| Ubicacion | Severidad | Categoria | Motivo | Accion detectada | Recomendacion |
|---|---|---|---|---|---|
${reviewRows || "| -- | -- | -- | -- | Sin hallazgos criticos | -- |"}

## Muestra de acciones clasificadas como controladas

| Ubicacion | Categoria | Severidad | Accion |
|---|---|---|---|
${protectedRows || "| -- | -- | -- | Sin acciones clasificadas |"}
`,
  );
}
