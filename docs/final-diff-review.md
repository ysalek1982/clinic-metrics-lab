# Revision final del diff pre-commit

Fecha: 2026-05-11

Este documento clasifica el worktree actual para revision humana antes de commit. No reemplaza la revision de codigo; sirve para separar cambios listos, cambios sensibles y archivos que no deben versionarse.

## Resumen ejecutivo

- Estado local: Release Candidate local revisable.
- Validacion local: `verify:pilot`, smoke local y auditoria UI pasan.
- Sin cierre de bloqueos externos: QA Seguridad P0, E2E Enteral, `report.exported`, deploy Edge Function y Pediatria WHO completa siguen pendientes.
- Seguridad: `service_role` no aparece en `src/`; las referencias a credenciales en docs/scripts son nombres de variables o placeholders.
- Versionado: `artifacts/`, `.env*`, `playwright/.auth`, `storageState.json`, `dist/` y `build/` estan protegidos por `.gitignore`.

## Clasificacion por archivo o patron

| Archivo | Tipo de cambio | Riesgo | Revisar antes de commit | Recomendacion |
|---|---|---|---|---|
| `.gitignore` | Guardrails de versionado | Bajo | Confirmar que ignora artifacts, auth state, env y builds | Seguro para commit |
| `.env.example` | Plantilla de entorno sin valores reales | Medio | Verificar que solo tenga placeholders publicos/operativos | Seguro para commit si no contiene valores reales |
| `package.json`, `package-lock.json` | Scripts y dependencias de piloto local | Medio | Revisar scripts nuevos y cambios de dependencias | Seguro para commit tras validacion final |
| `eslint.config.js`, `vite.config.ts`, `tailwind.config.ts` | Configuracion local/build | Medio | Confirmar que no fuerza secretos ni rutas locales | Seguro para commit |
| `src/components/common/*` | Componentes comunes de estado, KPI, badges y fuente de datos | Bajo | Revisar consistencia visual y props | Seguro para commit |
| `src/components/layout/*` | Shell visual, sidebar/topbar y fallback layout | Medio | Revisar navegacion, permisos visibles y responsive | Revisar manualmente |
| `src/components/ui/*` | Ajustes de componentes base | Medio | Revisar que no cambien contratos de shadcn/ui de forma incompatible | Revisar manualmente |
| `src/lib/formatters.ts`, `src/lib/presentation.ts`, `src/lib/authorization.ts`, `src/lib/exportArtifacts.ts` | Utilidades centrales | Medio | Revisar formato es-BO, traducciones y exports reales | Seguro para commit con tests |
| `src/domain/*` | Motores clinicos/deportivos/pediatricos | Alto | Revisar que no inventen z-score, somatotipos ni calculos no validados | Revision clinica/tecnica antes de commit |
| `src/services/*`, `src/hooks/*` | Integracion Supabase, datos reales y permisos | Alto | Revisar RLS asumida, errores, audit logs y no service role frontend | Revision manual obligatoria |
| `src/pages/app/PatientDetail.tsx` | Expediente central con muchas integraciones | Alto | Revisar tabs, datos reales, estados vacios y enlaces | Revision manual obligatoria |
| `src/pages/app/Reports.tsx` | Reportes/exportaciones | Alto | `report.exported` sigue pendiente de evidencia autenticada | Revision manual obligatoria |
| `src/pages/app/PackView.tsx`, `src/pages/app/pack-modules/*` | Enteral/parenteral y packs especializados | Alto | Revisar estados, acciones y que no cierre E2E sin credenciales | Revision manual obligatoria |
| `src/pages/app/UsersRoles.tsx` | Administracion usuarios/memberships | Alto | Revisar permisos UI, RPCs y Edge Function pendiente de deploy | Revision manual obligatoria |
| `src/pages/app/PediatricCurves.tsx` | Pediatria con referencia incompleta | Alto | Confirmar que no calcula z-score sin CSV oficiales | Revision clinica/tecnica |
| `src/pages/app/SportSomatocarta.tsx` o rutas deportivas equivalentes | Deportivo/somatocarta | Medio | Confirmar datos insuficientes y no puntos inventados | Revisar manualmente |
| `src/pages/app/Alerts.tsx`, `Labs.tsx`, `Agenda.tsx`, `Messages.tsx` | Modulos operativos | Medio | Revisar permisos/estados y acciones visibles | Seguro con smoke + revision UI |
| `src/data/demo.ts`, `src/data/saas.ts`, `src/data/clinical.ts` | Datos demo/catalogos | Medio | Confirmar que no alimentan vistas autenticadas como backing real | Seguro si auditor demo sigue en 0 prohibidos |
| `scripts/*.mjs` | Validadores, auditorias y readiness local | Medio | Revisar que no impriman secretos ni requieran credenciales para pasar local | Seguro para commit |
| `scripts/e2e-enteral-flow.mjs`, `scripts/qa-security-p0.mjs` | Scripts bloqueados por credenciales/usuarios | Alto | Revisar que no creen datos por API para simular UI ni usen service role | Mantener bloqueados hasta credenciales |
| `supabase/functions/admin-invite-user/index.ts` | Edge Function server-side | Alto | Service role permitido solo aqui; validar autorizacion por JWT antes de deploy | Revision manual obligatoria |
| `supabase/migrations/*` | Migraciones/RLS/seeds | Alto | No editar migraciones aplicadas sin criterio; revisar seed sin passwords reales | Revision manual obligatoria |
| `docs/*.md` | Documentacion de piloto/RC/auditorias | Bajo | Verificar que bloqueos sean consistentes y no contengan secretos | Seguro para commit |
| `.github/workflows/local-quality.yml` | CI local sin secretos | Bajo | Confirmar que no ejecuta E2E autenticado ni deploy | Seguro para commit |
| `artifacts/*` | Evidencia generada | Medio | No versionar salvo decision explicita | NO versionar |
| `playwright/.auth/*`, `storageState.json` | Estado autenticado | Alto | Puede contener cookies/tokens | NO versionar |
| `dist/`, `build/`, `playwright-report/`, `test-results/` | Salidas generadas | Bajo/Medio | No son fuente | NO versionar |
| `.env`, `.env.local`, `.env.production`, `.env.development` | Credenciales/config local | Alto | No deben estar versionados ni imprimirse | NO versionar |

## Archivos listos para commit

- Componentes comunes y tests locales que pasan.
- Scripts de auditoria/readiness que no imprimen valores sensibles.
- Documentacion de RC, backlog, guias y estado final.
- `.gitignore`, `.env.example` y scripts `package.json`, tras revision humana final.

## Archivos que conviene revisar manualmente

- `src/services/*` y `src/hooks/*`.
- `src/pages/app/PatientDetail.tsx`.
- `src/pages/app/Reports.tsx`.
- `src/pages/app/PackView.tsx` y `src/pages/app/pack-modules/*`.
- `src/pages/app/UsersRoles.tsx`.
- `supabase/functions/admin-invite-user/index.ts`.
- `supabase/migrations/*`.

## Archivos que no deben commitearse

- `artifacts/*` salvo que el equipo decida versionar evidencia puntual.
- `playwright/.auth/*`.
- Cualquier `storageState.json`.
- `dist/`, `build/`, `test-results/`, `playwright-report/`.
- `.env*` reales.

## Riesgos abiertos antes de piloto real

- Edge Function `admin-invite-user` no desplegada por falta de `SUPABASE_ACCESS_TOKEN`.
- QA Seguridad P0 bloqueada por usuarios Auth QA y credenciales.
- E2E Enteral bloqueado por `E2E_EMAIL/E2E_PASSWORD`.
- `report.exported` pendiente de evidencia visible en `/app/audit`.
- Pediatria WHO completa pendiente por CSV oficiales normalizados.

## Recomendacion

Proceder a revision humana por bloques antes de commit. No hacer squash unico sin revisar primero los archivos de alto riesgo funcional y Supabase.
