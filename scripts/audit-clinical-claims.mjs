import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyClinicalClaim,
  matchClinicalClaimPatterns,
  summarizeClinicalClaims,
} from "./lib/clinical-claims-classifier.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scanRoots = ["src", "docs", "scripts"];
const skipDirs = new Set(["node_modules", ".git", "dist", "build"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function scanFile(file) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  const content = await fs.readFile(file, "utf8").catch(() => "");
  const findings = [];
  content.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of matchClinicalClaimPatterns(line)) {
      const classification = classifyClinicalClaim(relative, pattern.id, line);
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
  const files = [];
  for (const scanRoot of scanRoots) {
    const fullRoot = path.join(root, scanRoot);
    files.push(...(await walk(fullRoot)));
  }

  const findings = (await Promise.all(files.map(scanFile))).flat();
  const summary = summarizeClinicalClaims(findings);
  const generatedAt = new Date().toISOString();
  const artifactDir = path.join(root, "artifacts", "security");
  await fs.mkdir(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, `clinical-claims-${generatedAt.replace(/[:.]/g, "-")}.json`);
  await fs.writeFile(
    artifactPath,
    JSON.stringify({ generatedAt, summary, findings }, null, 2),
    "utf8",
  );

  console.log("Clinical claims audit");
  console.log(`Artifact: ${artifactPath}`);
  console.log(`Total: ${summary.total}`);
  console.log(`Requiere revision: ${summary.requiresReview}`);
  console.log(`Riesgo UI: ${summary.riskyUi}`);
  console.log(`Riesgo reglas: ${summary.riskyRules}`);

  if (summary.riskyUi > 0 || summary.riskyRules > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
