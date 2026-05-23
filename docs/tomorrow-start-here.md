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

## 8. Post RC visible en Vercel

Leer tambien:

1. `docs/post-rc-development-status.md`
2. `docs/post-vercel-development-report.md`
3. `docs/npm-audit-review.md`
4. `docs/saas-admin/remote-activation-live-run.md`
5. `docs/saas-admin/remote-saas-activation-report.md`
6. `docs/saas-admin/commercial-saas-model.md`

Comandos utiles para verificar Vercel sin desplegar:

```powershell
$env:QA_REMOTE_URL='https://clinic-metrics-lab.vercel.app'; node scripts/module-by-module-qa.mjs
$env:SMOKE_BASE_URL='https://clinic-metrics-lab.vercel.app'; npm.cmd run smoke:routes
$env:UI_AUDIT_BASE_URL='https://clinic-metrics-lab.vercel.app'; npm.cmd run audit:ui
```

No ejecutar deploy ni `db push` sin autorizacion explicita. QA autenticado sigue pendiente hasta tener usuarios y storage state reales.

## 9. SaaS comercial remoto

Estado 2026-05-21:

1. Migraciones SaaS aplicadas en Supabase remoto de desarrollo.
2. Schema cache recargado con `NOTIFY pgrst, 'reload schema';`.
3. Planes remotos presentes: `free`, `pro`, `clinic_hospital` y `courtesy`.
4. `ysalek@gmail.com` confirmado como `platform_superadmin` con permisos SaaS.
5. `marcelacruz2000@gmail.com` confirmado, login validado, tenant Free personal activo.
6. Marcela tiene rol `free_member`, plan `free` y no tiene acceso SaaS Admin.
7. UI autenticada local validada: `artifacts/saas-ui-validation/2026-05-21T18-42-13-361Z/authenticated-ui-validation.json` con 21 checks, 0 warnings, 0 failures.
8. Vercel produccion fue actualizado: `https://clinic-metrics-lab.vercel.app/app/saas-admin` ya no devuelve 404 y sin sesion redirige a login.

Revisar primero manana:

1. Revisar manualmente el deploy Vercel actual y decidir si se versionan los cambios.
2. Probar un usuario Pro, Clinic/Hospital o Courtesy dedicado si se necesita evidencia visual de esos planes.
3. Si Marcela debe probar premium, otorgar `courtesy` con vencimiento desde SaaS Admin.
4. Mantener QA P0 separado hasta tener usuarios QA reales y evidencia completa.
5. No ejecutar commit/push sin revisar `docs/staging-commands-final.md`.

## 10. Commits sugeridos

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

## 11. Macrofase 45 - revisar primero

Cambio principal para revision humana:

1. Entrar como `ysalek@gmail.com`.
2. Abrir `/app/saas-admin`.
3. Ir a `Usuarios`.
4. Buscar `marcelacruz2000@gmail.com`.
5. Abrir `Ver detalle`.
6. Revisar plan, tenant, roles y permisos efectivos.
7. Abrir acciones de rol/estado solo para revisar; no guardar cambios destructivos sin decision explicita.

Evidencia/documentos nuevos:

- `docs/deep-module-functional-audit.md`
- `docs/full-system-module-audit.md`
- `docs/saas-admin/authenticated-ui-validation.md`

Para repetir QA autenticado:

```powershell
$env:MODULE_QA_STORAGE_STATE='playwright/.auth/ysalek.json'
$env:MODULE_QA_PERSONA='ysalek'
node scripts/module-by-module-qa.mjs
```

Con Marcela:

```powershell
$env:MODULE_QA_STORAGE_STATE='playwright/.auth/marcela-free.json'
$env:MODULE_QA_PERSONA='marcela-free'
node scripts/module-by-module-qa.mjs
```

No versionar `playwright/.auth/*` ni artifacts generados.

## 12. Macrofase 46 - frontend desplegado

Estado 2026-05-21:

- Preview desplegada: `https://clinic-metrics-nufozysjq-ysaleks-projects.vercel.app`.
- Produccion desplegada: `dpl_8ABUwDGLWBFR7JpAfXDjaK2fsPyk`.
- Alias activo: `https://clinic-metrics-lab.vercel.app`.
- `/app/saas-admin` ya contiene el build con la pestana Usuarios funcional.

Para crear storage states cuando existan passwords:

```powershell
npm.cmd run auth:storage
```

Variables esperadas, sin imprimir valores:

- `YSALEK_PASSWORD`
- `MARCELA_TEMP_PASSWORD` o `MARCELA_PASSWORD`
- `QA_PRO_PASSWORD`
- `QA_CLINIC_PASSWORD`
- `QA_COURTESY_PASSWORD`
- `QA_NO_MEMBERSHIP_PASSWORD`
- `E2E_EMAIL`
- `E2E_PASSWORD`

Luego ejecutar:

```powershell
npm.cmd run qa:security-p0
npm.cmd run qa:plangate
$env:MODULE_QA_STORAGE_STATE='playwright/.auth/ysalek.json'; $env:MODULE_QA_PERSONA='ysalek'; node scripts/module-by-module-qa.mjs
$env:MODULE_QA_STORAGE_STATE='playwright/.auth/marcela-free.json'; $env:MODULE_QA_PERSONA='marcela-free'; node scripts/module-by-module-qa.mjs
```

`report.exported` sigue pendiente hasta validar export PDF/XLSX y evento en `/app/audit`.

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

## Nota SaaS comercial 2026-05-21

Estado corregido:

- Free debe leerse como cuenta personal basica, con `/app/account` visible como "Mi cuenta / Mi espacio".
- Free no debe ver "Organizacion" institucional, "Usuarios", "Roles", "Auditoria institucional" ni "Configuracion institucional" como modulos funcionales.
- Pro es profesional individual; mantiene premium individual sin administracion institucional/global.
- Clinic/Hospital es institucional; habilita organizacion, equipo, roles, configuracion y auditoria de tenant.
- ysalek/platform admin administra SaaS global desde `/app/saas-admin`.
- Courtesy es temporal y debe auditarse.

Validacion rapida:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run smoke:routes
npm.cmd run audit:ui
npm.cmd run audit:permissions
npm.cmd run audit:secrets
npm.cmd run verify:pilot
npm.cmd run qa:saas-admin
npm.cmd run qa:saas-subscriptions
```

Pendiente antes de operar remoto completo:

- Aplicar `supabase/migrations/20260521194000_commercial_saas_institutional_entitlements.sql` cuando exista `SUPABASE_DB_PASSWORD`.
- Crear storage states autenticados para ysalek y Marcela si se quiere confirmar visualmente el menu por plan.
- Mantener Marcela como QA Free; si se prueba upgrade/cortesia, restaurarla a Free al final.

Actualizacion Fase 47:

- La migracion `20260521194000_commercial_saas_institutional_entitlements.sql` ya fue aplicada al remoto de desarrollo.
- El schema cache fue recargado.
- Produccion Vercel fue actualizada en `https://clinic-metrics-lab.vercel.app`.
- Marcela Free fue validada con Playwright autenticado en produccion.
- ysalek queda validado por DB como platform admin; falta password/storage state para validacion visual y mutaciones reales.
## Fase 48 - Punto de partida SaaS

Estado:

- Vercel produccion ya contiene el frontend SaaS.
- Supabase remoto tiene las migraciones SaaS aplicadas, incluyendo los parches `20260521221500` y `20260521222500`.
- ysalek puede administrar SaaS desde `/app/saas-admin`.
- Marcela queda en Free al cierre.
- QA Pro, Clinic, Courtesy y No Membership existen para revalidacion.

Antes de commit manual ejecutar:

```bash
npm run build
npm run lint
npm test -- --run
npm run smoke:routes
npm run audit:ui
npm run audit:permissions
npm run audit:secrets
npm run verify:pilot
npm run qa:saas-admin
npm run qa:saas-subscriptions
```

No versionar:

- `artifacts/`
- `playwright/.auth/`
- `.env*`
- `dist/`
- `test-results/`
- `playwright-report/`

## Macrofase 49 - punto de partida

Estado al 2026-05-22:

- `report.exported` ya tiene evidencia autenticada con PDF, Excel y audit logs.
- E2E Enteral ya paso contra Vercel con QA Clinic/Hospital.
- SaaS Free/Pro/Clinic/Courtesy/No Membership fue revalidado contra Vercel con `qa:functional-auth`.
- La migracion `20260522193500_sync_plan_packs_modules.sql` ya fue aplicada remoto para sincronizar packs/modulos por plan.
- Antes de ejecutar `audit:secrets`, borrar o no crear `playwright/.auth/*.json`; esos storage states son sesiones y no deben versionarse.

Comandos adicionales utiles:

```bash
npm run qa:functional-auth
npm run qa:security-p0
npm run qa:plangate
npm run e2e:enteral
npm run e2e:report-export
```

Pendiente principal:

- QA P0 clinico profundo con tenant-cross tabla por tabla.
- CRUD autenticado exhaustivo de pacientes, agenda, mensajes, alertas, recetas/menu, parenteral, pediatria y deportivo.
- Pediatria WHO completa con CSV oficiales.
- Edge Function `admin-invite-user`.
## Estado para retomar - 2026-05-23 Macrofase 50

1. Levantar app: `npm run dev -- --host 127.0.0.1 --port 8081` si 8080 esta ocupado.
2. Revisar primero: SaaS Free de Marcela, Dashboard personal y `/app/saas-admin` con ysalek.
3. Rutas criticas: `/app`, `/app/account`, `/app/tenants`, `/app/saas-admin`, `/app/reports`, `/app/pack/enteral/cockpit`, `/app/modules`.
4. Bloqueos: Pediatria WHO/OMS requiere CSV oficiales; CRUD manual profundo pendiente en modulos no E2E.
5. Credenciales: storage states no quedan versionados; recrear con `npm run auth:storage` si se necesita QA autenticada.
6. No versionar: `.env.local`, `playwright/.auth`, `artifacts`, `dist`.
7. Antes de commit futuro: `npm run build`, `npm run lint`, `npm test -- --run`, `npm run audit:secrets`, `npm run verify:pilot`.
8. Commits sugeridos futuros: `feat: add SaaS theme and personal free workspace UX`; `test: expand SaaS and report/enteral validation`; `docs: record five-pass module audit`.
# Macrofase 51 - Next Start

Fecha local: 2026-05-23.

Arrancar desde estos puntos:

1. No versionar `playwright/.auth`, `artifacts/`, `.tmp-preview-*` ni `.env.local`.
2. Revisar `docs/second-five-pass-final-report.md` para el cierre de modulos parciales.
3. La siguiente mejora real es Pediatria WHO/OMS con CSV oficiales.
4. Si se profundiza Parenteral, hacerlo explicitamente como modulo avanzado con validacion clinica.
5. Si se revisa UX final, usar `docs/mobile-responsive-review.md` y repetir `npm run qa:mobile`.

Comandos de regresion rapida:

```bash
npm run build
npm run lint
npm test -- --run
npm run qa:functional-auth
npm run qa:critical-crud
npm run qa:mobile
npm run e2e:parenteral
```
