# Release candidate local Nutri

Generado: 2026-05-18T05:14:40.227Z

- Estado: release_candidate_local_with_blockers
- Artifact: `artifacts/release/release-candidate-local-2026-05-18T05-14-40-228Z.json`
- Regla: RC local no cierra bloqueos que requieren credenciales, usuarios Auth, evidencia autenticada o CSV oficiales.

## Comandos ejecutables

```bash
npm run verify:pilot
npm run smoke:routes
npm run audit:ui
npm run visual:parity
npm run check:env
npm run unblock:steps
```

## Matriz RC

| Area | Estado | Evidencia | Riesgo |
|---|---|---|---|
| Build/lint/tests/smoke | ready_local | `artifacts/readiness/pilot-readiness-2026-05-18T05-07-16-843Z.json` | Validacion local automatizada; no sustituye QA multi-tenant. |
| Visual parity | ready_local | `artifacts/visual-parity/prototype-parity-2026-05-18T05-14-28-730Z.json` | Paridad local documentada; el prototipo es referencia visual, no datos. |
| Copilot contextual | ready_local | `artifacts/prototype-deep/prototype-deep-analysis-2026-05-13T06-10-14-065Z.json` | Asistente local protegido por ai.assist; tareas/timeline/consulta local; no usa IA generativa ni diagnostica. |
| UI actions | ready_local | `artifacts/ui-audit/ui-actions-2026-05-18T05-12-11-238Z.json` | Riesgos criticos deben mantenerse en cero. |
| Permission gates | ready_local | `artifacts/security/permission-gates-2026-05-18T05-13-07-978Z.json` | RLS/backend siguen siendo control final. |
| Demo usage | ready_local | `artifacts/security/demo-usage-2026-05-18T05-13-06-949Z.json` | Validar nuevamente con sesion autenticada real. |
| RLS/migrations | review_required | `artifacts/security/migrations-rls-2026-05-13T06-10-48-993Z.json` | No reemplaza QA P0 con usuarios reales. |
| Edge Function deploy | blocked_credential | `supabase/functions/admin-invite-user/index.ts` | Falta token si sigue bloqueado. |
| QA Seguridad P0 | blocked_users_or_credentials | `scripts/qa-security-p0.mjs` | Requiere usuarios Auth QA confirmados. |
| E2E Enteral | blocked_credential | `scripts/e2e-enteral-flow.mjs` | Requiere E2E_EMAIL/E2E_PASSWORD. |
| report.exported | blocked_authenticated_evidence | `docs/known-limitations.md` | Falta evidencia visible en /app/audit. |
| Pediatria WHO/OMS completa | blocked_clinical_input | `docs/references/pediatric-growth-official-sources.md` | Faltan CSV oficiales completos. |

## Criterio para pasar a piloto real

- QA Seguridad P0 cerrado con usuarios reales.
- E2E Enteral autenticado cerrado desde UI.
- Edge Function `admin-invite-user` desplegada y validada si se usara para usuarios.
- `report.exported` visible en `/app/audit`.
- Pediatria WHO completa solo con CSV oficiales cargados.

## Criterio para no pasar a piloto real

- Cualquier fuga cross-tenant.
- Cualquier secreto en frontend o archivos versionados.
- Pantallas principales con ErrorBoundary en carga normal.
- Botones clinicos o administrativos falsos sin estado limitado.
