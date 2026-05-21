const REQUIRED_FLAGS = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "E2E_EMAIL",
  "E2E_PASSWORD",
  "QA_TENANT_B_ID",
  "QA_NO_MEMBERSHIP_EMAIL",
  "QA_NO_MEMBERSHIP_PASSWORD",
  "QA_HSM_EMAIL",
  "QA_HSM_PASSWORD",
  "QA_TENANT_B_EMAIL",
  "QA_TENANT_B_PASSWORD",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

const rows = REQUIRED_FLAGS.map((name) => ({
  name,
  present: typeof process.env[name] === "string" && process.env[name].trim().length > 0,
}));

const missing = rows.filter((row) => !row.present).map((row) => row.name);
const readyLocal = [
  "build/lint/tests locales",
  "smoke local",
  "auditoria de acciones UI",
  "captura de paridad visual",
  "documentacion de piloto",
];

console.log("Nutri readiness env check");
console.log("No se imprimen valores sensibles.\n");

console.log("LISTO LOCALMENTE:");
readyLocal.forEach((item) => console.log(`- ${item}`));

console.log("\nVARIABLES:");
for (const row of rows) {
  console.log(`- ${row.name}: ${row.present ? "presente" : "ausente"}`);
}

console.log("\nBLOQUEADO POR CREDENCIAL:");
printBlocker("Edge Function", ["SUPABASE_ACCESS_TOKEN"]);
printBlocker("DB push remoto", ["SUPABASE_DB_PASSWORD"]);
printBlocker("E2E Enteral", ["E2E_EMAIL", "E2E_PASSWORD"]);
printBlocker("QA Seguridad P0", [
  "QA_NO_MEMBERSHIP_EMAIL",
  "QA_NO_MEMBERSHIP_PASSWORD",
  "QA_HSM_EMAIL",
  "QA_HSM_PASSWORD",
  "QA_TENANT_B_EMAIL",
  "QA_TENANT_B_PASSWORD",
  "QA_TENANT_B_ID",
]);

console.log("\nBLOQUEADO POR INSUMO CLINICO:");
console.log("- Pediatria WHO/OMS: CSV oficiales normalizados requeridos.");

console.log(`\nResumen: ${missing.length === 0 ? "entorno completo" : `${missing.length} variable(s) pendiente(s)`}.`);

function printBlocker(label, names) {
  const absent = names.filter((name) => !hasEnv(name));
  console.log(`- ${label}: ${absent.length === 0 ? "listo" : `falta ${absent.join(", ")}`}`);
}

function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}
