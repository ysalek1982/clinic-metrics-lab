# Guia de revision humana antes de commit

Fecha: 2026-05-11

| Area | Que revisar | Comando/Evidencia | Aprobado |
|---|---|---|---|
| Estado general | Worktree cargado pero clasificado | `docs/worktree-review.md` | [ ] |
| Calidad local | Build, lint, tests, smoke y readiness | `npm run verify:pilot` | [ ] |
| Visual/UX | Paridad visual y route health | `docs/prototype-parity-audit.md`, `docs/route-health-dashboard.md` | [ ] |
| Seguridad frontend | Sin service role, sin secretos, sin demo autenticado | `rg "service_role|SUPABASE_SERVICE_ROLE" src`, `npm run audit:demo` | [ ] |
| Permission gates | 0 criticos y acciones sensibles clasificadas | `npm run audit:permissions` | [ ] |
| Supabase | Migraciones, RLS y funciones idempotentes | `docs/migrations-rls-audit.md` | [ ] |
| Usuarios/admin | `UsersRoles`, Edge Function local y memberships | `src/pages/app/UsersRoles.tsx`, `supabase/functions/admin-invite-user/index.ts` | [ ] |
| Enteral/parenteral | Flujos reales y audit logs; E2E bloqueado sin credenciales | `docs/known-limitations.md` | [ ] |
| Pediatria | Estado de referencia incompleta sin z-score falso | `docs/references/pediatric-growth-official-sources.md` | [ ] |
| Reportes/export | Export real local; `report.exported` sigue pendiente de evidencia autenticada | `docs/release-checklist-current.md` | [ ] |
| Artifacts | Nada sensible listo para commit | `docs/artifacts-versioning-policy.md` | [ ] |

## Que no aceptar

- Secretos en frontend, docs o migraciones.
- Service role en `src/`.
- Datos demo como backing de vistas autenticadas.
- Botones administrativos/clinicos falsos sin `disabled`, permiso o estado `Proximamente`.
- Cerrar QA Seguridad P0 sin usuarios reales.
- Cerrar E2E Enteral sin credenciales y evidencia UI.
- Cerrar Pediatria WHO completa sin CSV oficiales.

## Flujo recomendado de revision

1. Revisar `docs/worktree-review.md`.
2. Ejecutar `npm run verify:pilot`.
3. Revisar `docs/route-health-dashboard.md`.
4. Ejecutar `npm run audit:demo` y `npm run audit:permissions`.
5. Revisar migraciones y Edge Function.
6. Separar commits logicos segun `docs/commit-plan.md`.
