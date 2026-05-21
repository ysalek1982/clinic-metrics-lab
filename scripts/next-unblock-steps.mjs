function hasEnv(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function allEnv(names) {
  return names.every(hasEnv);
}

const checks = [
  {
    title: "Desplegar Edge Function admin-invite-user",
    ready: hasEnv("SUPABASE_ACCESS_TOKEN"),
    missing: ["SUPABASE_ACCESS_TOKEN"].filter((name) => !hasEnv(name)),
    command: "npx supabase functions deploy admin-invite-user --project-ref nxqnmfvftwrvkjfahmmz",
  },
  {
    title: "Aplicar migraciones pendientes",
    ready: hasEnv("SUPABASE_DB_PASSWORD"),
    missing: ["SUPABASE_DB_PASSWORD"].filter((name) => !hasEnv(name)),
    command:
      '$dbUrl = "postgresql://postgres.nxqnmfvftwrvkjfahmmz:$env:SUPABASE_DB_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"; npx supabase db push --include-all --db-url $dbUrl',
  },
  {
    title: "Ejecutar E2E Enteral",
    ready: allEnv(["E2E_EMAIL", "E2E_PASSWORD"]),
    missing: ["E2E_EMAIL", "E2E_PASSWORD"].filter((name) => !hasEnv(name)),
    command: "node scripts/e2e-enteral-flow.mjs",
  },
  {
    title: "Ejecutar QA Seguridad P0",
    ready: allEnv([
      "QA_NO_MEMBERSHIP_EMAIL",
      "QA_NO_MEMBERSHIP_PASSWORD",
      "QA_HSM_EMAIL",
      "QA_HSM_PASSWORD",
      "QA_TENANT_B_EMAIL",
      "QA_TENANT_B_PASSWORD",
      "QA_TENANT_B_ID",
    ]),
    missing: [
      "QA_NO_MEMBERSHIP_EMAIL",
      "QA_NO_MEMBERSHIP_PASSWORD",
      "QA_HSM_EMAIL",
      "QA_HSM_PASSWORD",
      "QA_TENANT_B_EMAIL",
      "QA_TENANT_B_PASSWORD",
      "QA_TENANT_B_ID",
    ].filter((name) => !hasEnv(name)),
    command: "node scripts/qa-security-p0.mjs",
  },
  {
    title: "Confirmar report.exported en /app/audit",
    ready: allEnv(["E2E_EMAIL", "E2E_PASSWORD"]),
    missing: ["E2E_EMAIL", "E2E_PASSWORD"].filter((name) => !hasEnv(name)),
    command: "Abrir /app/reports, exportar PDF/XLSX autenticado y verificar /app/audit.",
  },
];

console.log("Nutri proximos desbloqueos");
console.log("No se imprimen valores sensibles.\n");

console.log("LISTO LOCALMENTE:");
console.log("- smoke local");
console.log("- build/lint/tests");
console.log("- visual parity script");
console.log("- auditoria UI local");
console.log("- docs de piloto");

console.log("\nBLOQUEADO POR CREDENCIAL:");
for (const check of checks) {
  console.log(`- ${check.title}: ${check.ready ? "listo para ejecutar" : `bloqueado por ${check.missing.join(", ")}`}`);
  if (check.ready) console.log(`  Comando: ${check.command}`);
}

console.log("\nBLOQUEADO POR INSUMO CLINICO:");
console.log("- Pediatria WHO/OMS: agregar CSV oficiales normalizados antes de importar referencias.");
