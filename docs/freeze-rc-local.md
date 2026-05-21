# Congelamiento tecnico del RC local

Fecha/hora: 2026-05-13 02:17:32 -04:00

Este documento congela el estado local del Release Candidate para revision humana y commit manual. No cierra bloqueos que requieren credenciales, usuarios Auth, evidencia autenticada o insumos clinicos oficiales.

## Estado congelado

- Estado: RC local revisable, no piloto productivo.
- Worktree: amplio y pendiente de revision manual antes de commit.
- Commit/push: no ejecutados.
- `.env.local`: no modificado.
- Service role en frontend: no permitido; mantener verificacion antes de commit.
- Datos demo autenticados: no habilitados como fuente real; auditoria demo queda en 0 hallazgos que requieren revision.

## Modulos listos localmente

- Shell autenticado Nutri, AppLayout, Sidebar y Topbar.
- Dashboard y expediente con integracion Copilot contextual.
- Copilot contextual: reglas locales, tareas, timeline, respuestas locales, quick links y permiso `ai.assist`.
- Pacientes, evaluaciones, planes, labs, alertas, agenda, mensajes y nutricion operativa en estado local revisable.
- Enteral funcional localmente, con E2E autenticado pendiente.
- Parenteral basico controlado, no avanzado.
- Deportivo/Somatocarta funcional condicionado a datos suficientes.
- Reportes/exportaciones locales, con `report.exported` pendiente de evidencia autenticada.
- Usuarios/Roles para memberships existentes, con Edge Function de invitacion pendiente de deploy.
- Auditoria, readiness, smoke, visual parity y guardrails locales.

## Modulos y cierres bloqueados

| Bloqueo | Motivo | Criterio para cerrar |
|---|---|---|
| Edge Function `admin-invite-user` | Falta `SUPABASE_ACCESS_TOKEN` | Deploy y prueba remota sin service role en frontend |
| QA Seguridad P0 | Faltan usuarios Auth QA reales y credenciales | Ejecutar matriz multi-tenant con anon, sin membership, HSM y tenant B |
| E2E Enteral | Faltan `E2E_EMAIL`/`E2E_PASSWORD` o storage state autenticado | Playwright crea/edita/loguea/pausa/cierra desde UI y verifica DB/audit |
| `report.exported` | Falta evidencia autenticada visible en `/app/audit` | Export PDF/XLSX real y evento visible en audit |
| Pediatria WHO completa | Faltan CSV oficiales WHO/OMS normalizados | Cargar referencias oficiales y validar z-score/percentil real |

## Validaciones ejecutadas para congelamiento

| Validacion | Estado | Evidencia |
|---|---|---|
| `git status --short` | Ejecutado | Worktree amplio, sin staging |
| `git diff --stat` | Ejecutado | 48 archivos tracked modificados en stat, mas archivos nuevos no trackeados |
| `npm run verify:pilot` | Pasa | `artifacts/readiness/pilot-readiness-2026-05-13T06-14-20-435Z.json` |
| `npm run smoke:routes` | Pasa | `artifacts/smoke/smoke-routes-local-2026-05-13T06-16-29-152Z.json` |
| `npm run audit:ui` | Pasa | `artifacts/ui-audit/ui-actions-2026-05-13T06-16-58-198Z.json` |
| `npm run audit:permissions` | Pasa | `artifacts/security/permission-gates-2026-05-13T06-17-06-426Z.json` |
| `npm test -- --run` | Pasa | 19 archivos, 93 tests |

## Scripts que pasan localmente

- `npm run build`
- `npm run lint`
- `npm test -- --run`
- `npm run smoke:routes`
- `npm run audit:ui`
- `npm run audit:permissions`
- `npm run check:env`
- `npm run unblock:steps`
- `npm run verify:pilot`

## Archivos de alto riesgo para revision humana

| Area | Archivos/patron | Riesgo | Revision requerida |
|---|---|---|---|
| Servicios y hooks | `src/services/*`, `src/hooks/*` | Alto | Contratos Supabase, errores, permisos y audit logs |
| Expediente | `src/pages/app/PatientDetail.tsx` | Alto | Integraciones longitudinales, Copilot, soporte hospitalario y estados |
| Reportes/export | `src/pages/app/Reports.tsx`, `src/lib/exportArtifacts.ts` | Alto | `report.exported` pendiente y permisos de exportacion |
| Packs hospitalarios | `src/pages/app/PackView.tsx`, `src/pages/app/pack-modules/*` | Alto | Enteral/parenteral, acciones de cierre y E2E pendiente |
| Usuarios/Roles | `src/pages/app/UsersRoles.tsx`, `supabase/functions/admin-invite-user/*` | Alto | Autorizacion, RPCs, Edge Function y no exposicion de secretos |
| Dominio clinico | `src/domain/*` | Alto | No inventar z-score, somatotipos, diagnosticos ni calculos no validados |
| Supabase | `supabase/migrations/*` | Alto | RLS, security definer, grants, seeds y migraciones ya aplicadas |
| UI base | `src/components/ui/*` | Medio | Contratos shadcn/ui y efectos colaterales visuales |

## Archivos que NO versionar

- `artifacts/*` salvo decision explicita de versionar evidencia puntual.
- `playwright/.auth/*`.
- Cualquier `storageState.json`.
- `dist/`, `build/`, `test-results/`, `playwright-report/`.
- `.env`, `.env.local`, `.env.production`, `.env.development`, `.env.*.local`.
- Logs temporales, traces y capturas pesadas no seleccionadas.

## Consistencia documental revisada

Los documentos revisados mantienen los mismos bloqueos:

- `docs/rc-local-executive-summary.md`
- `docs/release-candidate-local.md`
- `docs/pilot-final-status.md`
- `docs/commit-plan.md`
- `docs/final-diff-review.md`
- `docs/copilot-contextual-guide.md`

Estado consistente:

- RC local no equivale a piloto productivo.
- Edge Function bloqueada por `SUPABASE_ACCESS_TOKEN`.
- QA P0 bloqueada por usuarios Auth QA y credenciales.
- E2E Enteral bloqueado por `E2E_EMAIL`/`E2E_PASSWORD`.
- `report.exported` pendiente de evidencia autenticada.
- Pediatria WHO completa pendiente por CSV oficiales.

## Recomendacion de commit manual

Proceder solo despues de revision humana por bloques. Usar `docs/commit-plan.md` para separar commits logicos y evitar un commit unico de alto riesgo. Antes de cualquier commit manual, repetir:

```bash
npm run verify:pilot
npm run audit:ui
npm run audit:permissions
git status --short
```

No incluir archivos sensibles, artifacts pesados ni estado autenticado.
