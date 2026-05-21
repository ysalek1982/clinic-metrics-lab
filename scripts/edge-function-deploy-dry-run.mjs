import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedAt = new Date().toISOString();
const artifactDir = path.join(repoRoot, "artifacts", "readiness");
const functionName = "admin-invite-user";
const functionPath = path.join(repoRoot, "supabase", "functions", functionName, "index.ts");
const projectRef = "nxqnmfvftwrvkjfahmmz";

const checks = {
  supabaseAccessTokenPresent: hasEnv("SUPABASE_ACCESS_TOKEN"),
  functionExists: fs.existsSync(functionPath),
  packageExists: fs.existsSync(path.join(repoRoot, "package.json")),
  supabaseFolderExists: fs.existsSync(path.join(repoRoot, "supabase")),
  serviceRoleNotFrontend: !containsServiceRoleInFrontend(),
};

const ready = checks.supabaseAccessTokenPresent && checks.functionExists && checks.serviceRoleNotFrontend;
const missing = Object.entries(checks)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const artifact = {
  generatedAt,
  dryRun: true,
  functionName,
  projectRef,
  ready,
  missing,
  checks,
  commandWouldRun: `npx supabase functions deploy ${functionName} --project-ref ${projectRef}`,
  requiredSecretsServerSide: ["SUPABASE_SERVICE_ROLE_KEY"],
  requiredCallerPermissions: ["users.manage", "memberships.manage", "platform_superadmin"],
  risks: [
    "No usar service role en frontend.",
    "No devolver tokens sensibles al cliente.",
    "Validar JWT del caller antes de invitar o crear usuario.",
    "Registrar audit log user.invite/user.create si la funcion se ejecuta.",
  ],
};

fs.mkdirSync(artifactDir, { recursive: true });
const artifactPath = path.join(artifactDir, `edge-function-deploy-dry-run-${stamp(generatedAt)}.json`);
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), "utf8");

console.log("Edge Function deploy dry-run");
console.log("No se imprime SUPABASE_ACCESS_TOKEN.");
console.log(`Funcion: ${functionName}`);
console.log(`Estado: ${ready ? "precondiciones listas" : "bloqueado o incompleto"}`);
if (missing.length > 0) console.log(`Faltan/no listo: ${missing.join(", ")}`);
console.log(`Comando real cuando este listo: ${artifact.commandWouldRun}`);
console.log("NO se desplego nada.");
console.log(`Artifact: ${artifactPath}`);

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function containsServiceRoleInFrontend() {
  const srcDir = path.join(repoRoot, "src");
  if (!fs.existsSync(srcDir)) return false;
  return scanFiles(srcDir).some((file) => /SUPABASE_SERVICE_ROLE|service_role/i.test(fs.readFileSync(file, "utf8")));
}

function scanFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function stamp(value) {
  return value.replace(/[:.]/g, "-");
}
