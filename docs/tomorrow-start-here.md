# Tomorrow start here

Fecha/hora de cierre: 2026-05-18 01:19:19 -04:00

Este documento es el punto de arranque para continuar la revision humana del RC local de Nutri. No reemplaza QA P0, E2E autenticado ni validacion con credenciales reales.

## 1. Como levantar la app

1. Abrir terminal en `C:\Users\DELL\OneDrive\Documentos\Proyectos 2026\Nutricion\clinic-metrics-lab`.
2. Instalar dependencias si hace falta:
   ```powershell
   npm.cmd install
   ```
3. Levantar Vite:
   ```powershell
   npm.cmd run dev -- --host 127.0.0.1 --port 8082
   ```
4. Abrir:
   ```text
   http://127.0.0.1:8082/login
   ```

## 2. Que revisar primero

1. `docs/nightly-work-summary.md`
2. `docs/final-diff-review.md`
3. `docs/worktree-review.md`
4. `docs/high-risk-code-review.md`
5. `docs/staging-commands-final.md`
6. `docs/commit-plan.md`
7. `docs/module-by-module-qa.md`
8. `docs/internal-popups-audit.md`

## 3. Que rutas probar

Prioridad alta:

- `/app`
- `/app/modules`
- `/app/module-settings`
- `/app/copilot`
- `/app/patients`
- `/app/reports`
- `/app/users`
- `/app/pack/enteral/cockpit`
- `/app/pack/parenteral`
- `/app/audit`

Resto de rutas:

- `/app/anthropometry`
- `/app/screening`
- `/app/plans`
- `/app/agenda`
- `/app/messages`
- `/app/alerts`
- `/app/labs`
- `/app/foods`
- `/app/recipes`
- `/app/weekly-menu`
- `/app/pediatric-curves`
- `/app/somatocarta`
- `/app/settings`
- `/app/organization`

## 4. Que errores siguen bloqueados

- QA Seguridad P0 no esta cerrado porque faltan usuarios Auth QA reales y credenciales.
- E2E Enteral no esta cerrado porque faltan `E2E_EMAIL` y `E2E_PASSWORD`.
- Edge Function `admin-invite-user` no esta desplegada porque falta `SUPABASE_ACCESS_TOKEN`.
- `report.exported` no esta cerrado porque falta evidencia autenticada visible en `/app/audit`.
- Pediatria WHO/OMS completa no esta cerrada porque faltan CSV oficiales normalizados.
- `db push` remoto no debe ejecutarse sin `SUPABASE_DB_PASSWORD`, revision humana y autorizacion.

## 5. Que necesita credenciales

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `QA_NO_MEMBERSHIP_EMAIL`
- `QA_NO_MEMBERSHIP_PASSWORD`
- `QA_HSM_EMAIL`
- `QA_HSM_PASSWORD`
- `QA_TENANT_B_EMAIL`
- `QA_TENANT_B_PASSWORD`
- `QA_TENANT_B_ID`
- Opcional para E2E dedicado: `QA_E2E_EMAIL`, `QA_E2E_PASSWORD`

No guardar estos valores en `.env.local` versionado ni en codigo. No imprimirlos.

## 6. Que no versionar

- `artifacts/*` salvo decision explicita de evidencia puntual.
- `.env*` excepto `.env.example`.
- `playwright/.auth/*`.
- `storageState.json`.
- `dist/`.
- `build/`.
- `test-results/`.
- `playwright-report/`.
- Screenshots, traces y logs pesados.

## 7. Comandos antes de commit

Ejecutar antes de cualquier staging o commit manual:

```powershell
git status --short
git diff --stat
npm.cmd run build
npm.cmd run lint
npm.cmd test -- --run
$env:SMOKE_BASE_URL='http://127.0.0.1:8082'; npm.cmd run smoke:routes
$env:UI_AUDIT_BASE_URL='http://127.0.0.1:8082'; npm.cmd run audit:ui
npm.cmd run audit:demo
npm.cmd run audit:permissions
npm.cmd run audit:clinical-claims
npm.cmd run audit:secrets
$env:PARITY_NUTRI_URL='http://127.0.0.1:8082'; npm.cmd run visual:parity
$env:SMOKE_BASE_URL='http://127.0.0.1:8082'; npm.cmd run verify:pilot
```

Dry-runs seguros:

```powershell
node scripts/unblock-orchestrator.mjs
node scripts/qa-security-p0-dry-run.mjs
$env:E2E_BASE_URL='http://127.0.0.1:8082'; node scripts/e2e-enteral-dry-run.mjs
node scripts/edge-function-deploy-dry-run.mjs
```

## 8. Commits sugeridos

Usar `docs/staging-commands-final.md` y `docs/commit-plan.md`. Orden recomendado:

1. Design system, ModuleState, formatters y shell visual.
2. Copilot contextual.
3. Modulos clinicos principales.
4. Nutricion operativa.
5. Enteral y Parenteral.
6. Reportes y exportaciones.
7. Usuarios, roles y permisos.
8. Supabase functions y migraciones.
9. Scripts, auditorias y readiness.
10. Tests.
11. Documentacion.
12. Configuracion, CI y `.gitignore`.

No hacer staging masivo sin revisar archivos de alto riesgo.

## Estado final

El sistema queda funcional localmente como RC revisable. No esta listo para piloto real hasta cerrar los bloqueos de credenciales, usuarios QA, E2E autenticado, evidencia `report.exported` y referencias WHO/OMS oficiales.

## Nota de revision visual final

En la fase final visual del 2026-05-18, el navegador local disponible redirigio las rutas criticas `/app/*` a `/login` por falta de sesion activa. Por eso la revision visual autenticada queda pendiente y debe repetirse con un usuario real.

Rutas a revisar primero con sesion:

- `/app`
- `/app/modules`
- `/app/module-settings`
- `/app/copilot`
- `/app/patients`
- `/app/reports`
- `/app/pack/enteral/cockpit`
- `/app/pack/parenteral`
- `/app/users`
- `/app/audit`

Si reaparece un ErrorBoundary, capturar:

1. Ruta exacta.
2. Mensaje completo.
3. Accion previa.
4. Usuario/rol sin exponer secretos.
5. Screenshot.
6. Console error si esta disponible.

## Nota de estabilizacion 2026-05-20

Cambios locales recientes para revisar primero:

- `/app/patients`: fallbacks defensivos en sedes/servicios para evitar error de render por `name` faltante.
- Administracion de plataforma: catalogos normalizados antes de renderizar metricas y planes.
- `/app/recipes`: plantillas institucionales para hospital, escuela, comunidad y personal. Son borradores seguros; no se guardan ni calculan nutrientes hasta seleccionar alimentos reales del tenant.

No se borraron datos. Cualquier limpieza requiere confirmacion manual de:

1. Ambiente exacto.
2. Tablas o registros.
3. Si es solo dry-run o ejecucion real.
4. Credenciales/rol autorizado.
5. Backup o evidencia previa.
