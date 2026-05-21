import { describe, expect, it } from "vitest";
import { classifyClinicalClaim, summarizeClinicalClaims } from "../../scripts/lib/clinical-claims-classifier.mjs";
import { classifyDemoUsage, summarizeDemoUsage } from "../../scripts/lib/demo-usage-classifier.mjs";
import { classifyPermissionAction, detectPermissionAction, summarizePermissionActions } from "../../scripts/lib/permission-gate-classifier.mjs";
import { classifySecretHit, summarizeSecretHits } from "../../scripts/lib/secrets-classifier.mjs";

describe("audit classifiers", () => {
  it("clasifica demo prohibido en rutas autenticadas", () => {
    const result = classifyDemoUsage("src/pages/app/Reports.tsx", "source_demo", 'source: "demo"');

    expect(result.category).toBe("Uso prohibido en rutas autenticadas");
    expect(result.requiresReview).toBe(true);
  });

  it("clasifica demo permitido en docs y scripts", () => {
    expect(classifyDemoUsage("docs/demo-usage-audit.md", "allow_demo").requiresReview).toBe(false);
    expect(classifyDemoUsage("scripts/audit-demo-usage.mjs", "allow_demo").category).toBe("Uso permitido en scripts de auditoria");
  });

  it("resume hallazgos demo por revision", () => {
    const findings = [
      { ...classifyDemoUsage("src/pages/app/Dashboard.tsx", "source_demo"), type: "source_demo" },
      { ...classifyDemoUsage("docs/demo.md", "allow_demo"), type: "allow_demo" },
    ];

    expect(summarizeDemoUsage(findings).requiresReview).toBe(1);
  });

  it("clasifica permission gates con guard visible", () => {
    const result = classifyPermissionAction({
      line: '<Button onClick={save}>Guardar</Button>',
      context: "const { hasPermission } = useAuthorization();\n<Button disabled={!hasPermission('reports.create')} onClick={save}>Guardar</Button>",
    });

    expect(detectPermissionAction('<Button onClick={save}>Guardar</Button>')).toBe(true);
    expect(result?.category).toBe("Protegida por UI");
    expect(result?.requiresReview).toBe(false);
  });

  it("resume acciones criticas sin guard", () => {
    const actions = [
      { category: "Protegida por UI", severity: "medium", requiresReview: false },
      { category: "Requiere revision", severity: "critical", requiresReview: true },
    ];

    expect(summarizePermissionActions(actions).critical).toBe(1);
  });

  it("clasifica claims clinicos prohibidos sin bloquear disclaimers", () => {
    const risky = classifyClinicalClaim("src/pages/app/Copilot.tsx", "probable_diagnosis", "Diagnostico probable de riesgo");
    const disclaimer = classifyClinicalClaim("src/pages/app/Copilot.tsx", "probable_diagnosis", "No genera diagnostico probable");
    const docs = classifyClinicalClaim("docs/clinical-claims-audit.md", "dose_recommendation", "Ejemplo prohibido: recomiendo dosis");

    expect(risky.category).toBe("Riesgo en UI");
    expect(risky.requiresReview).toBe(true);
    expect(disclaimer.requiresReview).toBe(false);
    expect(docs.requiresReview).toBe(false);
  });

  it("resume claims clinicos por riesgo de UI y reglas", () => {
    const findings = [
      { ...classifyClinicalClaim("src/pages/app/Copilot.tsx", "probable_diagnosis", "Diagnostico probable"), patternId: "probable_diagnosis" },
      { ...classifyClinicalClaim("src/domain/copilot/copilotRules.ts", "must_administer", "Debe administrarse soporte"), patternId: "must_administer" },
      { ...classifyClinicalClaim("docs/claims.md", "prognosis", "No generar pronostico"), patternId: "prognosis" },
    ];

    const summary = summarizeClinicalClaims(findings);
    expect(summary.riskyUi).toBe(1);
    expect(summary.riskyRules).toBe(1);
    expect(summary.requiresReview).toBe(2);
  });

  it("clasifica secretos sin imprimir valores y permite service role solo en edge function", () => {
    const frontend = classifySecretHit("src/services/client.ts", "supabase_service_role", "SUPABASE_SERVICE_ROLE=");
    const edge = classifySecretHit("supabase/functions/admin-invite-user/index.ts", "supabase_service_role", "Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    const docs = classifySecretHit("docs/deployment-checklist.md", "supabase_access_token", "SUPABASE_ACCESS_TOKEN: placeholder");

    expect(frontend.category).toBe("Riesgo frontend");
    expect(frontend.requiresReview).toBe(true);
    expect(edge.category).toBe("Edge Function server-side");
    expect(edge.requiresReview).toBe(false);
    expect(docs.requiresReview).toBe(false);
  });

  it("resume secretos por riesgo de frontend y repo", () => {
    const findings = [
      { ...classifySecretHit("src/main.ts", "e2e_password", "E2E_PASSWORD="), patternId: "e2e_password" },
      { ...classifySecretHit("playwright/.auth/storageState.json", "storage_state", "storageState"), patternId: "storage_state" },
      { ...classifySecretHit(".env.example", "supabase_db_password", "SUPABASE_DB_PASSWORD=__REPLACE_ME__"), patternId: "supabase_db_password" },
    ];

    const summary = summarizeSecretHits(findings);
    expect(summary.frontendRisk).toBe(1);
    expect(summary.repoRisk).toBe(1);
    expect(summary.requiresReview).toBe(2);
  });
});
