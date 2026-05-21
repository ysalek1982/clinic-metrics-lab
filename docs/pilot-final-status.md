# Pilot Final Status - Nutri

Fecha: 2026-05-11

## Estado ejecutivo

Nutri queda preparado para piloto funcional controlado. No queda listo para produccion abierta hasta cerrar QA Seguridad P0, credenciales E2E, despliegue de Edge Function y referencias WHO/OMS oficiales.

## Modulos cerrados funcionalmente

- Nucleo clinico editable: pacientes, episodios, evaluaciones basicas, planes, permisos, audit logs y PatientDetail.
- Labs: funcional con datos reales y sin rehacer en fases posteriores.
- Alertas: persistentes, auditables y reflejadas en UI.
- Agenda: appointments reales, crear, editar, cancelar, completar y ver en PatientDetail.
- Mensajes: hilos reales, mensajes reales, marcar leido, cerrar y auditar.
- Nutricion operativa: alimentos, recetas y menu semanal con Supabase real.
- Reportes: vista previa, generacion de `report_runs`, reportes recientes y `report.generated`.
- Copilot contextual: `/app/copilot` funcional como command center local con datos reales, reglas deterministicas, tareas operativas, timeline, consulta local, permiso `ai.assist`, enlaces internos y sin IA generativa.
- Usuarios, roles y memberships: `/app/users`, RPCs admin, activar/desactivar/reactivar, upsert y asignar rol.
- Enteral: render estable y flujo funcional aceptado previamente; automatizacion E2E queda pendiente por credenciales.
- Parenteral: funcional basico controlado, no parenteral avanzado.
- Deportivo: funcional con somatocarta condicionada a datos antropometricos suficientes; reporte deportivo real disponible.
- Hardening runtime: rutas principales sin ErrorBoundary ni `undefined.data` en carga normal validada.

## Modulos parciales o condicionados

- Pediatria: funcional con referencia incompleta controlada. No calcular z-score/percentil si falta referencia oficial.
- Exportaciones: PDF/XLSX reales iniciales, pero Fase 18A sigue abierta hasta confirmar `report.exported` visible en `/app/audit`.
- QA Seguridad P0: bloqueado por falta de usuarios Auth QA confirmados y credenciales.
- Edge Function `admin-invite-user`: implementada localmente, pendiente de despliegue remoto.
- E2E Enteral automatizado: bloqueado por falta de `E2E_EMAIL` y `E2E_PASSWORD`.
- Copilot: smoke autenticado y QA de permisos quedan pendientes hasta tener usuarios reales, pero el cierre local no usa demo ni servicios externos.

## Bloqueos reales

1. `SUPABASE_ACCESS_TOKEN` faltante para desplegar `admin-invite-user`.
2. Usuarios Auth QA faltantes o no confirmados.
3. Credenciales E2E faltantes.
4. CSV oficiales WHO/OMS no versionados en repo.
5. `report.exported` no confirmado todavia en `/app/audit`.

## Reintento de cierre de bloqueos

Fecha: 2026-05-11

Se intento continuar con los bloqueos pendientes en el orden solicitado:

1. Desplegar Edge Function `admin-invite-user`.
2. Preparar usuarios QA desde `/app/users`.
3. Ejecutar QA Seguridad P0 multi-tenant.
4. Ejecutar E2E Enteral autenticado.
5. Confirmar `report.exported` en `/app/audit`.

Resultado: bloqueado porque el entorno actual no expone las variables requeridas. No se imprimieron secretos, no se uso service role en frontend y no se cerro ninguna fase sin evidencia.

Variables ausentes en el entorno del reintento:

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
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Credenciales necesarias

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

No guardar valores reales en `.env.local` versionado ni imprimirlos en logs.

## Usuarios Auth QA requeridos

- `qa-no-membership@nutri.test`: Auth confirmado, sin membership activo.
- `qa-hsm-clinical@nutri.test`: tenant HSM, rol clinico no-superadmin.
- `qa-tenant-b-clinical@nutri.test`: tenant B real, rol clinico no-superadmin.
- `qa-e2e-hsm@nutri.test`: tenant HSM, permisos suficientes para E2E Enteral.

## Migraciones presentes

Migraciones clave del piloto:

- `20260505130000_appointments_foundation.sql`
- `20260510130000_messages_foundation.sql`
- `20260510150000_operational_nutrition.sql`
- `20260510170000_reports_advanced_permissions.sql`
- `20260510193000_hospital_nutrition_support.sql`
- `20260510210000_sports_rls_hardening.sql`
- `20260511120000_admin_memberships_management.sql`
- `20260511123000_admin_memberships_upsert_patch.sql`

No crear migracion correctiva nueva salvo bug confirmado.

## Funciones Edge pendientes

- `supabase/functions/admin-invite-user/index.ts`

Estado: implementada localmente. Despliegue remoto pendiente por token.

## Pruebas E2E pendientes

- E2E Enteral automatizado: login, crear plan, editar plan, crear log, validar tolerancia, alerta, PatientDetail, pausar, cerrar, audit logs y RLS anon.
- QA Seguridad P0 multi-tenant con usuarios reales no-superadmin.
- Confirmacion visual de `report.exported` en `/app/audit`.

## Proximos comandos exactos

### 0. Verificar entorno local sin imprimir secretos

```bash
node scripts/check-env-readiness.mjs
node scripts/next-unblock-steps.mjs
```

### A. Desplegar Edge Function

```bash
npx supabase functions deploy admin-invite-user --project-ref nxqnmfvftwrvkjfahmmz
```

### B. Aplicar migraciones si hay pendientes

PowerShell:

```powershell
$dbUrl = "postgresql://postgres.nxqnmfvftwrvkjfahmmz:$env:SUPABASE_DB_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
npx supabase db push --include-all --db-url $dbUrl
```

### C. Ejecutar validacion tecnica

```bash
npm run build
npm run lint
npm test -- --run
```

### D. Ejecutar QA Seguridad P0

```bash
node scripts/qa-security-p0.mjs
```

### E. Ejecutar E2E Enteral

```bash
node scripts/e2e-enteral-flow.mjs
```

### F. Ejecutar smoke local de rutas

Sin sesion reutilizable:

```bash
node scripts/smoke-routes-local.mjs
```

Con sesion autenticada guardada en storage state:

```bash
$env:SMOKE_STORAGE_STATE="playwright/.auth/e2e-hsm.json"
node scripts/smoke-routes-local.mjs
```

## Riesgos antes de produccion

- Sin QA tenant-cross con usuarios no-superadmin no se puede afirmar aislamiento multi-tenant completo.
- Sin usuario sin membership no se puede cerrar bloqueo de acceso autenticado sin organizacion.
- Sin `report.exported` visible en audit, exportaciones quedan funcionales pero auditoria incompleta.
- Sin referencias WHO/OMS completas no se puede declarar pediatria avanzada completa.
- Sin E2E Enteral automatizado no queda evidencia reproducible del flujo UI completo.

## Verificaciones Fase 23

- Service role frontend: no se encontro uso ejecutable en `src`. Las menciones de `SUPABASE_SERVICE_ROLE_KEY` estan en documentacion y en `supabase/functions/admin-invite-user/index.ts`.
- Demo autenticado: `DEMO_USER` queda definido en `src/data/demo.ts`, pero no aparece importado como backing de vistas autenticadas. Los hooks de datos reales usan `isDemoMode` y deshabilitan queries demo cuando hay sesion.
- Mojibake: se corrigio el texto detectado en Enteral y no quedan coincidencias evidentes de caracteres corruptos en la revision final.
- Documentacion alineada: readiness, QA Seguridad P0, limitaciones, checklist, manuales y bloqueos E2E apuntan a los mismos bloqueos reales.

## Security patch - seed superadmin

Fecha: 2026-05-11

Hallazgo: la migracion `20260423175000_seed_platform_superadmin_ysalek.sql` contenia una credencial hardcodeada para crear/actualizar el usuario Auth superadmin.

Accion tomada:

- Se elimino la gestion de credenciales desde la migracion.
- La migracion ya no crea ni actualiza credenciales en `auth.users`.
- La migracion solo crea perfil publico, memberships y roles si el usuario Auth ya existe.
- No se imprimio ni copio el valor sensible.

Riesgo residual:

- Si esa credencial fue usada en algun entorno, debe rotarse.
- Si el repositorio ya fue publicado con esa migracion, limpiar historial requiere autorizacion explicita y procedimiento separado.

## Fase 24 - Calidad local sin credenciales

Estado: cerrada localmente cuando build, lint y tests pasan.

Acciones preparadas:

- `scripts/smoke-routes-local.mjs`: smoke de rutas principales con Playwright. Reporta si no hay sesion autenticada en vez de cerrar QA/E2E.
- `scripts/check-env-readiness.mjs`: verifica presencia de variables necesarias sin imprimir valores.
- `scripts/next-unblock-steps.mjs`: muestra comandos desbloqueables segun variables disponibles.
- Pruebas unitarias adicionales para motores enteral, deportivo, pediatrico, calculadora nutricional y artefactos PDF/XLSX.
- Botones sin implementacion real revisados: exportacion de auditoria queda deshabilitada como Proximamente; PDF pediatrico desde PackView queda deshabilitado hasta referencias oficiales completas.

Bloqueos que siguen sin cerrarse:

- `report.exported` visible en `/app/audit`: requiere sesion autenticada observable.
- Edge Function `admin-invite-user`: requiere `SUPABASE_ACCESS_TOKEN` para deploy.
- QA Seguridad P0: requiere usuarios Auth QA reales y credenciales.
- E2E Enteral: requiere `E2E_EMAIL` y `E2E_PASSWORD` o storage state autenticado.
- Pediatria avanzada completa: requiere CSV oficiales WHO/OMS normalizados.

## Fase 25 - Empaquetado local de piloto

Estado: cerrada localmente cuando `verify:pilot` pasa.

Comandos agregados:

- `npm run check:env`: revisa variables necesarias sin imprimir valores.
- `npm run unblock:steps`: muestra el siguiente paso segun credenciales disponibles.
- `npm run smoke:routes`: ejecuta smoke local de rutas principales.
- `npm run qa:local`: build, lint, tests y smoke local.
- `npm run verify:pilot`: readiness maestro, QA local y pasos de desbloqueo.
- `npm run pilot:local`: alias operativo para `verify:pilot`.

Artefactos y documentos:

- `artifacts/readiness/pilot-readiness-*.json`: resumen local de readiness.
- `docs/pilot-module-matrix.md`: matriz de estado por modulo.
- `docs/pilot-demo-script.md`: guion honesto para demo/pre-piloto.

### Guardrails locales verificados en Fase 25

- `service_role` / `SUPABASE_SERVICE_ROLE` en `src`: sin coincidencias.
- `DEMO_USER` en rutas autenticadas y servicios: sin coincidencias.
- Imports de `src/data/demo` como backing de `/app/*`: sin coincidencias.
- Mojibake en `src`, `docs` y `scripts`: sin coincidencias funcionales; solo queda el patron detector dentro de `scripts/smoke-routes-local.mjs`.
- `.env` / `.env.local` versionados: sin archivos rastreados por git.
- Storage state versionado: no hay `playwright/.auth` rastreado; no se detecto storageState versionado.
- No se intento cerrar QA P0, E2E Enteral, Edge Function deploy, `report.exported` ni Pediatria WHO completa.

## Reglas de continuidad

- No usar service role en frontend.
- No usar demo como backing de vistas autenticadas.
- No crear tenants QA sin aprobacion explicita.
- No declarar avanzada una funcionalidad que opera como base controlada.
- No cerrar bloqueos por credenciales sin evidencia real.

## Macrofase 26 - Paridad visual funcional y piloto robusto

Estado: ejecutada localmente sin cerrar bloqueos remotos.

Acciones locales:

- Se agrego `scripts/capture-prototype-parity.mjs` para capturar screenshots del prototipo Lovable y Nutri local.
- Se agrego `scripts/audit-ui-actions.mjs` para detectar acciones visibles con riesgo de boton falso.
- Se amplio `scripts/smoke-routes-local.mjs` para guardar screenshots, metadata y `docs/smoke-routes-summary.md`.
- Se agrego `docs/prototype-clone-roadmap.md` para guiar la paridad visual sin copiar datos demo.
- Se reforzaron scripts de readiness con secciones `LISTO LOCALMENTE`, `BLOQUEADO POR CREDENCIAL` y `BLOQUEADO POR INSUMO CLINICO`.
- Se agregaron pruebas locales para detectores de smoke, autorizacion, reportes deportivos y exportaciones vacias.

Guardrails:

- No se uso service role en frontend.
- No se tocaron credenciales ni `.env.local`.
- No se cerraron Edge Function deploy, QA Seguridad P0, E2E Enteral, `report.exported` ni Pediatria WHO completa.

Comandos utiles:

```bash
npm run visual:parity
npm run audit:ui
npm run smoke:routes
npm run verify:pilot
```

## Macrofase 27 - Productizacion local profunda

Estado: ejecutada localmente sin credenciales.

Agregados principales:

- Componentes comunes de estado: `ModuleState`, `EmptyState`, `ForbiddenState`, `ErrorState`, `LoadingState`.
- Capa de presentacion ampliada para estados, roles, permisos, severidades y tonos.
- Formateadores locales para numeros, fechas, moneda, kcal, kg, ml y gramos.
- Auditorias locales: accesibilidad, permission gates, demo usage y migraciones/RLS.
- Documentos nuevos: design system, UX audit, forms validation, CI local, changelog, backlog priorizado, setup local y checklist QA demo.

Bloqueos preservados:

- Edge Function deploy.
- QA Seguridad P0.
- E2E Enteral autenticado.
- `report.exported`.
- Pediatria WHO completa.

## Macrofase 28 - Aplicacion de auditorias

Estado: ejecutada localmente sin cerrar bloqueos remotos.

Acciones aplicadas:

- `ModuleState` aplicado en soporte parenteral y deportivo para empty/loading/error/forbidden/datos insuficientes.
- Formatters es-BO aplicados en Dashboard, Labs, Foods, Recipes, WeeklyMenu, PatientDetail, Enteral, Parenteral y Deportivo.
- `Generar informe` en Dashboard queda gateado por permisos de reportes.
- Validaciones estructurales agregadas para numeros no negativos en Enteral, Parenteral y Deportivo.
- `audit-ui-actions` v2 clasifica acciones funcionales, limitadas, riesgos altos y medios.
- `smoke-routes-local` v2 genera score por ruta y `docs/smoke-routes-score.md`.
- `release-checklist-local` genera `docs/release-checklist-current.md` y artifact JSON.
- Tests locales suben a 61 casos.

Bloqueos preservados:

- Edge Function deploy: falta `SUPABASE_ACCESS_TOKEN`.
- QA Seguridad P0: faltan usuarios Auth QA y credenciales.
- E2E Enteral: faltan `E2E_EMAIL` y `E2E_PASSWORD`.
- `report.exported`: falta evidencia autenticada visible en `/app/audit`.
- Pediatria WHO completa: faltan CSV oficiales normalizados.

Versionado/artifacts:

- `artifacts/` conserva evidencia local de auditorias y smoke; revisar peso antes de commit.
- `playwright/.auth`, `storageState.json`, `.env*`, `dist` y `build` deben mantenerse fuera de git.
