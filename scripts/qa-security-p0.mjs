import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HSM_TENANT_ID = "11111111-1111-4111-8111-111111111111";

const clinicalTables = [
  "patients",
  "encounters",
  "clinical_assessments",
  "clinical_notes",
  "nutrition_plans",
  "lab_orders",
  "lab_results",
  "alert_acknowledgements",
  "appointments",
  "message_threads",
  "messages",
  "message_read_receipts",
  "recipes",
  "recipe_ingredients",
  "weekly_menus",
  "weekly_menu_items",
  "food_items",
  "report_runs",
  "pediatric_growth_records",
  "pediatric_growth_results",
  "enteral_plans",
  "enteral_daily_logs",
  "parenteral_plans",
  "parenteral_monitoring_logs",
  "sports_profiles",
  "sports_bodycomp_snapshots",
  "audit_logs",
  "tenant_memberships",
  "membership_roles",
];

const tenantScopedTables = new Set(
  clinicalTables.filter((table) => table !== "membership_roles"),
);

function env(name) {
  return process.env[name]?.trim() ?? "";
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function summarizeResult({ data, error }) {
  if (error) {
    return {
      ok: true,
      exposedRows: 0,
      rowCount: 0,
      error: {
        code: error.code ?? null,
        message: error.message ?? "Supabase error",
      },
    };
  }

  const rowCount = Array.isArray(data) ? data.length : 0;
  return {
    ok: rowCount === 0,
    exposedRows: rowCount,
    rowCount,
    error: null,
  };
}

async function queryTable(client, table, filters = {}) {
  let query = client.from(table).select("*").limit(5);

  if (filters.tenantId && tenantScopedTables.has(table)) {
    query = query.eq("tenant_id", filters.tenantId);
  }

  if (table === "food_items" && filters.tenantScopedOnly) {
    query = query.not("tenant_id", "is", null);
  }

  return summarizeResult(await query);
}

async function signIn(url, key, email, password) {
  if (!email || !password) {
    return { client: null, blocked: true, reason: "Credenciales no configuradas." };
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    return { client: null, blocked: true, reason: error.message };
  }

  return { client, blocked: false, reason: null };
}

async function runReadMatrix(label, client, filters = {}) {
  const rows = [];
  for (const table of clinicalTables) {
    rows.push({
      table,
      ...(await queryTable(client, table, {
        ...filters,
        tenantScopedOnly: table === "food_items",
      })),
    });
  }

  return {
    label,
    passed: rows.every((row) => row.ok),
    rows,
  };
}

async function main() {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY") || env("VITE_SUPABASE_ANON_KEY");
  const tenantBId = env("QA_TENANT_B_ID");
  const requiredBase = [];
  if (!url) requiredBase.push("VITE_SUPABASE_URL");
  if (!key) requiredBase.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "non_destructive_security_probe",
    hsmTenantId: HSM_TENANT_ID,
    tenantBId: tenantBId || null,
    blocked: requiredBase.length > 0,
    missingEnv: requiredBase,
    checks: [],
  };

  if (requiredBase.length === 0) {
    const anonClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    report.checks.push(await runReadMatrix("anon", anonClient));

    const users = [
      {
        label: "sin_membership",
        email: env("QA_NO_MEMBERSHIP_EMAIL"),
        password: env("QA_NO_MEMBERSHIP_PASSWORD"),
      },
      {
        label: "hsm_no_superadmin",
        email: env("QA_HSM_EMAIL"),
        password: env("QA_HSM_PASSWORD"),
        tenantId: HSM_TENANT_ID,
        crossTenantId: tenantBId,
      },
      {
        label: "tenant_b_no_superadmin",
        email: env("QA_TENANT_B_EMAIL"),
        password: env("QA_TENANT_B_PASSWORD"),
        tenantId: tenantBId,
        crossTenantId: HSM_TENANT_ID,
      },
    ];

    for (const user of users) {
      const auth = await signIn(url, key, user.email, user.password);
      if (auth.blocked) {
        report.checks.push({
          label: user.label,
          passed: false,
          blocked: true,
          reason: auth.reason,
        });
        report.blocked = true;
        continue;
      }

      if (user.label === "sin_membership") {
        report.checks.push(await runReadMatrix(user.label, auth.client));
        continue;
      }

      if (user.tenantId) {
        report.checks.push(await runReadMatrix(`${user.label}_own_tenant`, auth.client, { tenantId: user.tenantId }));
      }

      if (user.crossTenantId) {
        report.checks.push(await runReadMatrix(`${user.label}_cross_tenant`, auth.client, { tenantId: user.crossTenantId }));
      } else {
        report.checks.push({
          label: `${user.label}_cross_tenant`,
          passed: false,
          blocked: true,
          reason: "QA_TENANT_B_ID no configurado.",
        });
        report.blocked = true;
      }
    }
  }

  const artifactDir = join(process.cwd(), "artifacts", "security");
  mkdirSync(artifactDir, { recursive: true });
  const artifactPath = join(artifactDir, `qa-p0-${timestamp()}.json`);
  writeFileSync(artifactPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const failed = report.checks.filter((check) => check.passed === false && !check.blocked);
  const blocked = report.checks.filter((check) => check.blocked);
  console.log(
    JSON.stringify(
      {
        artifactPath,
        blocked: report.blocked || blocked.length > 0,
        failedChecks: failed.map((check) => check.label),
        blockedChecks: blocked.map((check) => ({ label: check.label, reason: check.reason })),
        missingEnv: report.missingEnv,
      },
      null,
      2,
    ),
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "QA Seguridad P0 fallo.");
  process.exitCode = 1;
});
