import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifySecretHit, matchSecretPatterns, summarizeSecretHits } from "./lib/secrets-classifier.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipDirs = new Set(["node_modules", ".git", "dist", "build"]);
const skipExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf", ".zip", ".woff", ".woff2"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && !skipExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

async function scanFile(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  if (relative.startsWith("artifacts/security/secrets-local-")) return [];
  const content = await fs.readFile(file, "utf8").catch(() => "");
  const findings = [];
  content.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of matchSecretPatterns(line)) {
      const classification = classifySecretHit(relative, pattern.id, line);
      findings.push({
        file: relative,
        lineNumber: index + 1,
        patternId: pattern.id,
        patternLabel: pattern.label,
        category: classification.category,
        allowed: classification.allowed,
        requiresReview: classification.requiresReview,
        action: classification.action,
      });
    }
  });
  return findings;
}

async function main() {
  const files = await walk(root);
  const findings = (await Promise.all(files.map(scanFile))).flat();
  const summary = summarizeSecretHits(findings);
  const generatedAt = new Date().toISOString();
  const artifactDir = path.join(root, "artifacts", "security");
  await fs.mkdir(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, `secrets-local-${generatedAt.replace(/[:.]/g, "-")}.json`);
  await fs.writeFile(
    artifactPath,
    JSON.stringify({ generatedAt, summary, findings }, null, 2),
    "utf8",
  );

  console.log("Secrets local audit");
  console.log("No se imprimen valores sensibles.");
  console.log(`Artifact: ${artifactPath}`);
  console.log(`Total: ${summary.total}`);
  console.log(`Requiere revision: ${summary.requiresReview}`);
  console.log(`Riesgo frontend: ${summary.frontendRisk}`);
  console.log(`Riesgo repo: ${summary.repoRisk}`);

  if (summary.frontendRisk > 0 || summary.repoRisk > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
