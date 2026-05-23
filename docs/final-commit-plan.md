# Final Commit Plan

Fecha local: 2026-05-23.

Este documento propone commits logicos. No se ejecuto `git add`, commit ni push.

| Orden | Commit sugerido | Archivos | Riesgo | Prueba previa |
|---:|---|---|---|---|
| 1 | SaaS comercial, planes y permisos | `src/pages/app/SaasAdmin.tsx`, `src/pages/app/Account.tsx`, `src/services/saasAdminService.ts`, `src/services/subscriptionService.ts`, `src/hooks/useSaasAdmin.ts`, `src/hooks/useSubscription.ts`, `src/lib/saasAdmin.ts`, `src/lib/subscriptionAccess.ts`, `src/data/saas.ts`, `src/types/saas.ts`, `src/features/auth/RouteGuards.tsx` | Alto | `npm test -- --run`, `npm run qa:saas-admin`, `npm run qa:saas-subscriptions`, `npm run qa:functional-auth` |
| 2 | UI global, temas y legibilidad | `src/index.css`, `src/App.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/layout/AppTopbar.tsx`, `src/components/common/ThemeToggle.tsx`, `src/hooks/useTheme.ts`, `src/lib/theme.ts`, tests de theme | Medio | `npm run build`, `npm test -- --run`, `npm run qa:mobile`, `npm run visual:parity` |
| 3 | Modulos clinicos y PlanGate | `src/config/moduleRegistry.ts`, `src/lib/moduleAccess.ts`, `src/pages/app/PackView.tsx`, `src/pages/app/Dashboard.tsx`, `src/pages/app/ModulesCenter.tsx`, `src/pages/app/TenantSelector.tsx`, `PlanGate`, `SubscriptionBadge`, `PlanLimitNotice` | Alto | `npm run qa:plangate`, `npm run qa:functional-auth`, `npm run audit:clinical-claims` |
| 4 | E2E y QA scripts | `scripts/e2e-parenteral-flow.mjs`, `scripts/e2e-enteral-flow.mjs`, `scripts/e2e-report-export-flow.mjs`, `scripts/qa-critical-crud-persistence.mjs`, `scripts/qa-mobile-responsive.mjs`, `scripts/qa-authenticated-functional.mjs`, `scripts/qa-security-p0-real.mjs`, `scripts/qa-plangate-matrix.mjs` | Medio | `npm run qa:critical-crud`, `npm run e2e:parenteral`, `npm run e2e:enteral`, `npm run e2e:report-export` |
| 5 | Supabase migrations | `supabase/migrations/20260521153000_*` a `20260522193500_sync_plan_packs_modules.sql` | Alto | Revision SQL humana, `npx supabase db push --dry-run`, QA remoto/RLS |
| 6 | Documentacion final | `docs/final-worktree-review.md`, `docs/final-commit-plan.md`, `docs/pilot-readiness-executive-summary.md`, `docs/five-pass-*`, `docs/second-five-pass-final-report.md`, `docs/mobile-responsive-review.md`, `docs/saas-admin/`, `docs/pilot-*` | Bajo/medio | Revision humana de afirmaciones y pendientes |
| 7 | Configuracion y package scripts | `.gitignore`, `package.json`, `package-lock.json`, `vite.config.ts`, `vercel.json` | Medio | `npm run build`, `npm run lint`, `npm test -- --run`, `npm run audit:secrets` |

## Revision manual antes de cada commit

- No incluir `playwright/.auth`, `artifacts`, `dist`, `test-results`, `playwright-report`, `.env.local` ni descargas de E2E.
- Verificar que migrations no contienen passwords ni datos clinicos reales.
- Revisar que scripts con `SUPABASE_SERVICE_ROLE_KEY` esten fuera de `src/` y no impriman valores.
- Mantener billing real desactivado.
- Mantener Pediatria WHO/OMS como pendiente hasta tener CSV oficiales.

