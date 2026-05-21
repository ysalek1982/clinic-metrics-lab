import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const migrationsDir = path.join(repoRoot, "supabase", "migrations");
const artifactDir = path.join(repoRoot, "artifacts", "security");
const docsDir = path.join(repoRoot, "docs");
const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
const findings = [];
const tables = [];

for (const file of listFiles(migrationsDir, /\.sql$/)) {
  const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
  const sql = fs.readFileSync(file, "utf8");
  const lower = sql.toLowerCase();
  let match;
  while ((match = tableRegex.exec(sql))) {
    const table = match[1];
    const hasTenantId = new RegExp(`create\\s+table[\\s\\S]*?${table}[\\s\\S]*?tenant_id`, "i").test(sql);
    const hasRls = lower.includes(`alter table public.${table.toLowerCase()} enable row level security`) || lower.includes(`alter table ${table.toLowerCase()} enable row level security`);
    const hasPolicy = lower.includes(`on public.${table.toLowerCase()}`) || lower.includes(`on ${table.toLowerCase()}`);
    tables.push({ file: rel, table, hasTenantId, hasRls, hasPolicy });
    if (hasTenantId && !hasRls) findings.push({ file: rel, table, risk: "tenant_table_without_rls_in_same_file" });
  }
  if (/security\s+definer/i.test(sql)) findings.push({ file: rel, table: null, risk: "security_definer_review" });
  if (/grant\s+.*\s+to\s+anon/i.test(sql)) findings.push({ file: rel, table: null, risk: "grant_to_anon_review" });
  if (/auth\.uid\(\)/i.test(sql) || /current_tenant_ids\(\)/i.test(sql)) {
    findings.push({ file: rel, table: null, risk: "auth_context_used" });
  }
}

fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });
const artifactPath = path.join(artifactDir, `migrations-rls-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(artifactPath, JSON.stringify({ generatedAt: new Date().toISOString(), tables, findings }, null, 2));
writeDoc(artifactPath, tables, findings);
console.log(`Migrations RLS audit: ${tables.length} tabla(s), ${findings.length} hallazgo(s). Artifact: ${artifactPath}`);

function listFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, pattern);
    return pattern.test(full) ? [full] : [];
  });
}

function writeDoc(filePath, rows, risks) {
  const tableRows = rows
    .map((item) => `| \`${item.table}\` | \`${item.file}\` | ${item.hasTenantId ? "Si" : "No"} | ${item.hasRls ? "Si" : "No"} | ${item.hasPolicy ? "Si" : "No"} |`)
    .join("\n");
  const riskRows = risks
    .slice(0, 120)
    .map((item) => `| \`${item.file}\` | ${item.table ? `\`${item.table}\`` : "--"} | ${item.risk} | Revisar manualmente antes de produccion |`)
    .join("\n");
  fs.writeFileSync(
    path.join(docsDir, "migrations-rls-audit.md"),
    `# Auditoria local de migraciones y RLS

Generado: ${new Date().toISOString()}

- Artifact: \`${path.relative(repoRoot, filePath).replace(/\\/g, "/")}\`
- Alcance: analisis estatico. No modifica migraciones aplicadas.

## Tablas detectadas

| Tabla | Migracion | tenant_id | RLS en archivo | Politica en archivo |
|---|---|---:|---:|---:|
${tableRows || "| -- | -- | -- | -- | -- |"}

## Hallazgos

| Archivo | Tabla | Riesgo | Accion |
|---|---|---|---|
${riskRows || "| -- | -- | Sin hallazgos | -- |"}
`,
  );
}
