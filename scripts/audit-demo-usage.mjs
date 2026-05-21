import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_USAGE_PATTERNS, classifyDemoUsage, summarizeDemoUsage } from "./lib/demo-usage-classifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const artifactDir = path.join(repoRoot, "artifacts", "security");
const docsDir = path.join(repoRoot, "docs");
const patterns = DEMO_USAGE_PATTERNS;
const files = [
  ...listFiles(path.join(repoRoot, "src"), /\.(tsx|ts)$/),
  ...listFiles(path.join(repoRoot, "scripts"), /\.mjs$/),
  ...listFiles(path.join(repoRoot, "docs"), /\.(md|mdx)$/),
];
const findings = [];

for (const file of files) {
  const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        const classification = classifyDemoUsage(rel, pattern.type, line);
        findings.push({
          file: rel,
          line: index + 1,
          type: pattern.type,
          ...classification,
          sample: line.trim().slice(0, 160),
        });
      }
    }
  });
}

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });
const artifactPath = path.join(artifactDir, `demo-usage-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
const summary = summarizeDemoUsage(findings);
fs.writeFileSync(artifactPath, JSON.stringify({ generatedAt: new Date().toISOString(), summary, findings }, null, 2));
writeDoc(artifactPath, findings);
console.log(`Demo usage audit: ${findings.length} hallazgo(s), ${summary.requiresReview} requiere(n) revision. Artifact: ${artifactPath}`);

function listFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, pattern);
    return pattern.test(full) ? [full] : [];
  });
}

function writeDoc(filePath, rows) {
  const summary = summarizeDemoUsage(rows);
  const categoryRows = Object.entries(summary.byCategory)
    .map(([type, data]) => `| ${type} | ${data.total} | ${data.requiresReview} |`)
    .join("\n");
  const reviewRows = rows
    .filter((item) => item.requiresReview)
    .map(
      (item) =>
        `| \`${item.file}:${item.line}\` | ${item.type} | ${item.category} | ${item.action} | \`${item.sample.replaceAll("|", "\\|")}\` |`,
    )
    .join("\n");
  fs.writeFileSync(
    path.join(docsDir, "demo-usage-audit.md"),
    `# Auditoria de uso demo

Generado: ${new Date().toISOString()}

- Artifact: \`${path.relative(repoRoot, filePath).replace(/\\/g, "/")}\`
- Regla: demo solo puede operar sin sesion autenticada o en tests/scripts.
- Resumen: ${summary.total} hallazgos, ${summary.requiresReview} para revision.
- Meta: 0 usos prohibidos en rutas autenticadas y 0 dudosos sin explicar.

| Tipo | Total | Requiere revision |
|---|---:|---:|
${categoryRows || "| -- | 0 | 0 |"}

## Hallazgos que requieren revision

| Archivo | Tipo | Clasificacion | Accion | Muestra |
|---|---|---|---|---|
${reviewRows || "| -- | -- | -- | Sin hallazgos pendientes | -- |"}
`,
  );
}
