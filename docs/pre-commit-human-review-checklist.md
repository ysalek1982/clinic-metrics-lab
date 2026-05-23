# Pre-Commit Human Review Checklist

Fecha local: 2026-05-23.

Objetivo: preparar commits manuales por bloques sin ejecutar staging, commit ni push. Este checklist separa riesgo funcional, riesgo clinico y riesgo operativo para revision humana.

| Bloque | Archivos | Riesgo | Revisar antes de commit | Prueba obligatoria |
|---|---|---|---|---|
| SaaS comercial / planes / permisos | `src/pages/app/SaasAdmin.tsx`, `src/pages/app/Account.tsx`, `src/services/saasAdminService.ts`, `src/services/subscriptionService.ts`, `src/hooks/useSaasAdmin.ts`, `src/hooks/useSubscription.ts`, `src/lib/saasAdmin.ts`, `src/lib/subscriptionAccess.ts`, `src/data/saas.ts`, `src/types/saas.ts`, `src/features/auth/RouteGuards.tsx`, `src/pages/ActivateInvite.tsx` | Alto | Free no administra; ysalek/platform admin si administra; Marcela no se autoescala; billing real sigue desactivado; no service role en frontend. | `npm test -- --run`; `npm run qa:saas-admin`; `npm run qa:saas-subscriptions`; `npm run qa:functional-auth`; `npm run audit:permissions`; `npm run audit:secrets` |
| UI global / temas claro-oscuro / legibilidad | `src/index.css`, `src/App.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/layout/AppTopbar.tsx`, `src/components/common/ThemeToggle.tsx`, `src/hooks/useTheme.ts`, `src/lib/theme.ts`, `src/components/common/ThemeToggle.test.tsx`, `src/lib/theme.test.ts` | Medio | Tema light/dark/system; localStorage; foco visible; mobile sin overflow; no cambios visuales masivos no revisados. | `npm run build`; `npm test -- --run`; `npm run qa:mobile`; `npm run visual:parity` |
| Modulos clinicos y PlanGate | `src/config/moduleRegistry.ts`, `src/lib/moduleAccess.ts`, `src/lib/moduleAccess.test.ts`, `src/pages/app/PackView.tsx`, `src/pages/app/Dashboard.tsx`, `src/pages/app/ModulesCenter.tsx`, `src/pages/app/TenantSelector.tsx`, `src/components/common/PlanGate.tsx`, `src/components/common/PlanLimitNotice.tsx`, `src/components/common/SubscriptionBadge.tsx` | Alto | Free bloqueado en premium; Pro/Clinic/Courtesy correctos; no diagnostico/tratamiento/dosis; Pediatria WHO/OMS no marcada como completa. | `npm run qa:plangate`; `npm run qa:functional-auth`; `npm run audit:clinical-claims`; `npm test -- --run` |
| CRUD critico / Enteral / Parenteral / report export | Cambios funcionales relacionados en pages/services/hooks clinicos; `scripts/e2e-enteral-flow.mjs`, `scripts/e2e-parenteral-flow.mjs`, `scripts/e2e-report-export-flow.mjs`, `scripts/qa-critical-crud-persistence.mjs` | Alto | Datos QA con prefijo controlado; auditoria real; Parenteral solo basico; report.exported con PDF/XLSX; no datos clinicos reales inventados. | `npm run qa:critical-crud`; `npm run e2e:enteral`; `npm run e2e:parenteral`; `npm run e2e:report-export`; `npm run audit:clinical-claims` |
| Scripts QA / E2E | `scripts/qa-authenticated-functional.mjs`, `scripts/qa-mobile-responsive.mjs`, `scripts/qa-plangate-matrix.mjs`, `scripts/qa-security-p0-real.mjs`, `scripts/qa-saas-admin.mjs`, `scripts/qa-saas-subscriptions.mjs`, `scripts/module-by-module-qa.mjs`, `scripts/audit-internal-popups.mjs`, helpers en `scripts/lib/` | Medio | Scripts no imprimen secretos; `SUPABASE_SERVICE_ROLE_KEY` solo server-side; artifacts van a rutas ignoradas; bloqueos se reportan honestamente. | `npm run qa:functional-auth`; `npm run qa:security-p0`; `npm run qa:mobile`; `node scripts/module-by-module-qa.mjs`; `node scripts/audit-internal-popups.mjs`; `npm run audit:secrets` |
| Supabase migrations | `supabase/migrations/20260521153000_saas_admin_approvals_and_courtesy_memberships.sql`, `20260521165000_saas_subscription_plans_and_time_limited_courtesies.sql`, `20260521172000_commercial_saas_free_pro_clinic_hospital.sql`, `20260521183000_saas_admin_role_permission_rpcs.sql`, `20260521184500_*`, `20260521190000_*`, `20260521190500_*`, `20260521191000_*`, `20260521194000_commercial_saas_institutional_entitlements.sql`, `20260521221500_fix_saas_subscription_admin_rpc_ambiguity.sql`, `20260521222500_fix_pro_reports_export_access.sql`, `20260522193500_sync_plan_packs_modules.sql` | Alto | RLS/RPC security definer; platform admin checks; idempotencia; no passwords; no datos clinicos reales; dry-run si se reaplica. | Revision SQL humana; `npx supabase db push --dry-run`; `npm run qa:security-p0`; `npm run qa:saas-admin`; `npm run qa:saas-subscriptions` |
| Documentacion final | `docs/final-worktree-review.md`, `docs/final-commit-plan.md`, `docs/pre-commit-human-review-checklist.md`, `docs/pilot-readiness-executive-summary.md`, `docs/five-pass-*`, `docs/second-five-pass-final-report.md`, `docs/mobile-responsive-review.md`, `docs/saas-admin/`, `docs/saas-plan-access-matrix.md`, `docs/plangate-validation-matrix.md`, `docs/pilot-*`, `docs/post-vercel-development-report.md` | Bajo/medio | No afirmar cierre clinico total; mantener WHO/OMS pendiente; no copiar secretos; no incluir contrasenas ni tokens; no prometer billing real. | Revision humana; `npm run audit:secrets` |
| Configuracion/package | `.gitignore`, `package.json`, `package-lock.json`, `vite.config.ts`, `vercel.json` | Medio | Scripts nuevos correctos; artifacts ignorados; Vercel SPA rewrite; lockfile revisado; no cambios de build innecesarios. | `npm run build`; `npm run lint`; `npm test -- --run`; `npm run verify:pilot`; `npm run audit:secrets` |

## Confirmacion de no versionar

Antes de staging manual confirmar:

- `.env*`
- `playwright/.auth/*`
- `artifacts/*`
- `dist/`
- `build/`
- `test-results/`
- `playwright-report/`
- descargas PDF/XLSX
- screenshots/traces/logs pesados

Comando recomendado:

```bash
git status --short
git check-ignore .env.local playwright/.auth/test.json artifacts/test.json dist/test.js build/test.js test-results/test.json playwright-report/index.html
```

