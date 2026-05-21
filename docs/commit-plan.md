# Plan recomendado de commits

Fecha: 2026-05-15

No ejecutar commit automaticamente. No ejecutar `git add` automaticamente. Este plan existe para revision humana y staging manual por bloques logicos.

## Estado

- RC local congelado y validado.
- `npm run verify:pilot` pasa localmente.
- Tests locales: 111 tests.
- Bloqueos externos preservados: Edge Function deploy, QA Seguridad P0, E2E Enteral, `report.exported`, Pediatria WHO/OMS completa.
- No versionar artifacts ni credenciales.

## Commits logicos sugeridos

| Commit sugerido | Objetivo | Archivos sugeridos | Riesgo | Pruebas relacionadas |
|---|---|---|---|---|
| `feat: add Nutri design system and resilient app shell` | Consolidar layout, topbar/sidebar, componentes comunes, `ModuleState`, badges, cards, estados visibles y polish visual. | `src/components/common/*`, `src/components/layout/*`, `src/components/ui/*`, `src/index.css`, `tailwind.config.ts`, `src/components/NavLink.tsx` | Medio/alto por alcance visual transversal | `npm run build`, `npm run lint`, `npm run smoke:routes`, `npm run visual:parity` |
| `feat: add contextual Copilot command center` | Incorporar Copilot operativo contextual con reglas locales, query parser, hook/servicio, ruta, sidebar, dashboard y PatientDetail. | `src/pages/app/Copilot.tsx`, `src/domain/copilot/*`, `src/services/copilotService.ts`, `src/hooks/useCopilotContext.ts`, `src/App.tsx`, `src/pages/app/Dashboard.tsx`, `src/pages/app/PatientDetail.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/layout/AppTopbar.tsx` | Alto por integrar datos reales y permisos | `npm test -- --run`, `npm run audit:ui`, `npm run audit:permissions`, `npm run audit:clinical-claims` |
| `feat: harden clinical modules for pilot workflows` | Robustecer pacientes, expediente, labs, alertas, agenda, screening, planes, antropometria y rutas clinicas con datos reales, estados y permisos. | `src/pages/app/Patients.tsx`, `src/pages/app/PatientDetail.tsx`, `src/pages/app/Labs.tsx`, `src/pages/app/Alerts.tsx`, `src/pages/app/Agenda.tsx`, `src/pages/app/Screening.tsx`, `src/pages/app/Plans.tsx`, `src/pages/app/Anthropometry.tsx`, `src/pages/app/Encounters.tsx`, `src/pages/app/NewEvaluation.tsx`, `src/hooks/useClinicalData.ts`, `src/services/clinicalService.ts`, `src/services/labService.ts`, `src/services/appointmentService.ts`, `src/services/messageService.ts` | Alto por superficie clinica | `npm run verify:pilot`, `npm run smoke:routes`, `npm run audit:ui` |
| `feat: add operational nutrition modules` | Añadir alimentos, recetas, menu semanal y calculos operativos sin demo autenticado. | `src/pages/app/Foods.tsx`, `src/pages/app/Recipes.tsx`, `src/pages/app/WeeklyMenu.tsx`, `src/services/foodService.ts`, `src/services/recipeService.ts`, `src/services/weeklyMenuService.ts`, `src/hooks/useFoods.ts`, `src/hooks/useRecipes.ts`, `src/hooks/useWeeklyMenus.ts`, `src/domain/nutrition/*` | Medio | `npm test -- --run`, `npm run smoke:routes` |
| `feat: add enteral and parenteral controlled workflows` | Mantener Enteral real y Parenteral basico controlado, con validaciones, PatientDetail y auditoria preparada. | `src/pages/app/PackView.tsx`, `src/pages/app/pack-modules/*`, `src/services/specialtyService.ts`, `src/hooks/useSpecialtyModules.ts`, `src/domain/clinical/enteralEngine*`, `src/types/clinical.ts` | Alto por flujos clinicos hospitalarios | `npm test -- --run`, `npm run smoke:routes`, E2E autenticado pendiente |
| `feat: add reports and export artifacts` | Reportes reales, previews, PDF/XLSX locales y auditoria preparada sin cerrar `report.exported` sin evidencia autenticada. | `src/pages/app/Reports.tsx`, `src/services/reportService.ts`, `src/lib/exportArtifacts.ts`, `src/hooks/useReports.ts` | Alto por export de datos tenant-scoped | `npm test -- --run`, `npm run audit:ui`; evidencia `report.exported` pendiente |
| `feat: add users roles and tenant admin readiness` | Gestionar usuarios/memberships/roles desde UI, permisos, QA panel y readiness para Edge Function. | `src/pages/app/UsersRoles.tsx`, `src/services/identityService.ts`, `src/hooks/useIdentity.ts`, `src/hooks/useAuthorization.ts`, `src/lib/authorization.ts`, `src/pages/ActivateInvite.tsx`, `src/pages/Login.tsx`, `src/pages/Onboarding.tsx`, `src/pages/app/TenantSelector.tsx`, `src/pages/app/PlatformAdmin.tsx`, `src/pages/app/InstitutionSettings.tsx`, `src/services/institutionService.ts`, `src/hooks/useInstitutionSettings.ts`, `src/services/saasService.ts`, `src/hooks/useSaasCatalogs.ts` | Alto por administracion y permisos | `npm run audit:permissions`, `npm run audit:secrets`, `npm run verify:pilot` |
| `feat: add Supabase migrations and secure admin invite function` | Versionar migraciones, RLS/documentacion SQL y Edge Function local `admin-invite-user` sin deploy. | `supabase/migrations/*`, `supabase/functions/admin-invite-user/*` | Alto, requiere revision SQL/manual | `npm run audit:rls`, `npm run audit:secrets`; deploy bloqueado por token |
| `chore: add readiness dry-runs and local guardrails` | Scripts de smoke, visual parity, UI/actions, demo, permissions, RLS, clinical claims, secrets, unblock orchestrator y dry-runs. | `scripts/*`, `scripts/lib/*`, `package.json`, `package-lock.json` | Medio | `npm run audit:ui`, `npm run audit:demo`, `npm run audit:permissions`, `npm run audit:clinical-claims`, `npm run audit:secrets`, dry-runs |
| `test: expand local domain service and guardrail coverage` | Tests locales de dominio, Copilot, servicios, formatters, presentation, auth y clasificadores. | `src/**/*.test.ts`, `src/**/*.test.tsx`, `src/test/*` | Bajo/medio | `npm test -- --run` |
| `docs: add RC local pilot readiness and unblock guides` | Documentacion de piloto, revision humana, staging, runbooks, auditorias y estado final. | `docs/*`, `AGENTS.md` | Bajo | Revision humana |
| `chore: update config ci gitignore and env example` | Configuracion local, CI/quality, gitignore de artifacts/secretos, env example y Vite/ESLint. | `.gitignore`, `.env.example`, `.github/*`, `eslint.config.js`, `vite.config.ts`, `src/vite-env.d.ts`, `src/main.tsx`, `src/pages/Index.tsx`, `src/pages/NotFound.tsx`, `src/store/app.ts`, `src/data/*`, `src/features/*`, `src/integrations/*`, `src/types/*` | Medio por configuracion transversal | `npm run build`, `npm run lint`, `npm run audit:secrets` |

## Archivos que NO deben entrar

- `artifacts/*`
- `.env*` excepto `.env.example`
- `playwright/.auth/*`
- `storageState.json`
- `dist/`
- `build/`
- `test-results/`
- `playwright-report/`
- screenshots/traces pesados

## Bloqueos que deben seguir en PR/commit

- Edge Function deploy requiere `SUPABASE_ACCESS_TOKEN`.
- DB push requiere `SUPABASE_DB_PASSWORD` y revision humana.
- QA Seguridad P0 requiere usuarios Auth QA y credenciales.
- E2E Enteral requiere `E2E_EMAIL/E2E_PASSWORD` o `QA_E2E_EMAIL/QA_E2E_PASSWORD`.
- `report.exported` requiere evidencia autenticada en `/app/audit`.
- Pediatria WHO completa requiere CSV oficiales.
