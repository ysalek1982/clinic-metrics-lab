# Plan final de staging manual

Fecha: 2026-05-15

No ejecutar automaticamente. Estos comandos son sugerencias para una persona revisora desde la raiz del repo.

Nota: algunos archivos tienen cambios mixtos y pueden requerir `git add -p` si se quiere separar con mas precision. No versionar artifacts ni credenciales.

| Commit | Archivos | Riesgo | Comando git add | Validacion previa |
|---|---|---|---|---|
| 1. Design system y ModuleState | Componentes comunes, layout, sidebar/topbar, shadcn UI, estilos globales | Medio/alto por impacto visual transversal | `git add -- src/components/common src/components/layout src/components/ui src/components/NavLink.tsx src/index.css tailwind.config.ts` | `npm run build && npm run lint && npm run smoke:routes` |
| 2. Copilot contextual | Ruta Copilot, dominio/reglas, query parser, servicio/hook e integraciones en Dashboard/PatientDetail/sidebar/topbar | Alto por permisos y datos reales | `git add -- src/pages/app/Copilot.tsx src/domain/copilot src/services/copilotService.ts src/hooks/useCopilotContext.ts src/App.tsx src/pages/app/Dashboard.tsx src/pages/app/PatientDetail.tsx src/components/layout/AppSidebar.tsx src/components/layout/AppTopbar.tsx` | `npm test -- --run && npm run audit:clinical-claims && npm run audit:ui && npm run audit:permissions` |
| 3. Modulos clinicos principales | Pacientes, expediente, labs, alertas, agenda, screening, planes, antropometria, encounters | Alto por superficie clinica | `git add -- src/pages/app/Patients.tsx src/pages/app/PatientDetail.tsx src/pages/app/Labs.tsx src/pages/app/Alerts.tsx src/pages/app/Agenda.tsx src/pages/app/Screening.tsx src/pages/app/Plans.tsx src/pages/app/Anthropometry.tsx src/pages/app/Encounters.tsx src/pages/app/NewEvaluation.tsx src/services/clinicalService.ts src/services/labService.ts src/services/appointmentService.ts src/services/messageService.ts src/hooks/useClinicalData.ts src/hooks/useLabs.ts src/hooks/useAppointments.ts src/hooks/useMessages.ts` | `npm run verify:pilot && npm run smoke:routes` |
| 4. Nutricion operativa | Alimentos, recetas, menu semanal, calculadora nutricional, catalogos | Medio | `git add -- src/pages/app/Foods.tsx src/pages/app/Recipes.tsx src/pages/app/WeeklyMenu.tsx src/services/foodService.ts src/services/recipeService.ts src/services/weeklyMenuService.ts src/hooks/useFoods.ts src/hooks/useRecipes.ts src/hooks/useWeeklyMenus.ts src/domain/nutrition src/hooks/useClinicalCatalogs.ts src/hooks/useCatalogStatus.ts src/services/catalogService.ts` | `npm test -- --run && npm run smoke:routes` |
| 5. Enteral / Parenteral | PackView, modulos pack, soporte enteral/parenteral, engines clinicos, tipos clinicos | Alto por flujo clinico hospitalario | `git add -- src/pages/app/PackView.tsx src/pages/app/pack-modules src/services/specialtyService.ts src/hooks/useSpecialtyModules.ts src/domain/clinical/enteralEngine.ts src/domain/clinical/enteralEngine.test.ts src/types/clinical.ts` | `npm test -- --run && npm run smoke:routes` |
| 6. Reportes / exportaciones | Reportes, servicio, hooks, PDF/XLSX, artifacts exportables | Alto por datos tenant-scoped y auditoria pendiente | `git add -- src/pages/app/Reports.tsx src/services/reportService.ts src/services/reportService.test.ts src/hooks/useReports.ts src/lib/exportArtifacts.ts src/lib/exportArtifacts.test.ts` | `npm test -- --run && npm run audit:ui` |
| 7. Usuarios / roles / permisos | UsersRoles, identidad, permisos, admin tenant, onboarding/login, autorizacion | Alto por seguridad multi-tenant | `git add -- src/pages/app/UsersRoles.tsx src/pages/app/InstitutionSettings.tsx src/pages/app/TenantSelector.tsx src/pages/app/PlatformAdmin.tsx src/pages/ActivateInvite.tsx src/pages/Login.tsx src/pages/Onboarding.tsx src/services/identityService.ts src/services/institutionService.ts src/services/saasService.ts src/hooks/useIdentity.ts src/hooks/useAuthorization.ts src/hooks/useInstitutionSettings.ts src/hooks/useSaasCatalogs.ts src/lib/authorization.ts src/lib/authorization.test.ts` | `npm run audit:permissions && npm run audit:secrets && npm run verify:pilot` |
| 8. Supabase functions / migraciones | Edge Function local y SQL/migraciones Supabase | Alto, requiere revision SQL manual | `git add -- supabase/functions/admin-invite-user supabase/migrations` | `npm run audit:rls && npm run audit:secrets` |
| 9. Scripts / auditorias / readiness | Smoke, visual parity, audits, dry-runs, orquestador, readiness, package scripts | Medio | `git add -- scripts package.json package-lock.json` | `npm run audit:ui && npm run audit:demo && npm run audit:permissions && npm run audit:clinical-claims && npm run audit:secrets && node scripts/unblock-orchestrator.mjs` |
| 10. Tests | Tests de dominio, servicios, UI helpers, classifiers y setup | Bajo/medio | `git add -- "src/**/*.test.ts" "src/**/*.test.tsx" src/test` | `npm test -- --run` |
| 11. Documentacion | Runbooks, auditorias, RC, backlog, planes de staging/commit, manuales | Bajo | `git add -- docs AGENTS.md` | Revision humana de docs y bloqueos preservados |
| 12. Config / CI / gitignore | Gitignore, env example, GitHub workflow, ESLint/Vite, tipos, rutas base, datos/capas de integracion | Medio por configuracion transversal | `git add -- .gitignore .env.example .github eslint.config.js vite.config.ts src/vite-env.d.ts src/main.tsx src/pages/Index.tsx src/pages/NotFound.tsx src/store/app.ts src/data src/features src/integrations src/types src/lib/utils.ts src/lib/view-source.ts` | `npm run build && npm run lint && npm run audit:secrets` |

## No versionar

- `artifacts/*`
- `.env*` excepto `.env.example`
- `playwright/.auth/*`
- `storageState.json`
- `dist/`
- `build/`
- `test-results/`
- `playwright-report/`
- screenshots/traces pesados

## Bloqueos que deben quedar en la descripcion del PR

- Edge Function deploy bloqueada por `SUPABASE_ACCESS_TOKEN`.
- DB push bloqueado por `SUPABASE_DB_PASSWORD` y revision humana.
- QA Seguridad P0 bloqueado por usuarios Auth QA y credenciales.
- E2E Enteral bloqueado por credenciales E2E.
- `report.exported` pendiente de evidencia autenticada en `/app/audit`.
- Pediatria WHO completa bloqueada por CSV oficiales WHO/OMS.
