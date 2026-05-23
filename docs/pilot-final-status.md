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
- SaaS Admin: `/app/saas-admin` implementado para solicitudes de acceso, aprobacion/rechazo, codigos, planes, suscripciones y cortesias; migraciones SaaS aplicadas en remoto de desarrollo.
- Enteral: render estable y flujo funcional aceptado previamente; automatizacion E2E queda pendiente por credenciales.
- Parenteral: funcional basico controlado, no parenteral avanzado.
- Deportivo: funcional con somatocarta condicionada a datos antropometricos suficientes; reporte deportivo real disponible.
- Hardening runtime: rutas principales sin ErrorBoundary ni `undefined.data` en carga normal validada.

## Modulos parciales o condicionados

- Pediatria: funcional con referencia incompleta controlada. No calcular z-score/percentil si falta referencia oficial.
- Exportaciones: PDF/XLSX reales iniciales, pero Fase 18A sigue abierta hasta confirmar `report.exported` visible en `/app/audit`.
- QA Seguridad P0: bloqueado por falta de usuarios Auth QA confirmados y credenciales.
- Edge Function `admin-invite-user`: implementada localmente, pendiente de despliegue remoto.
- SaaS Admin remoto: migraciones SaaS aplicadas en Supabase remoto de desarrollo; no crea Auth users ni contrasenas desde frontend.
- E2E Enteral automatizado: bloqueado por falta de `E2E_EMAIL` y `E2E_PASSWORD`.
- Copilot: smoke autenticado y QA de permisos quedan pendientes hasta tener usuarios reales, pero el cierre local no usa demo ni servicios externos.

## Bloqueos reales

1. `SUPABASE_ACCESS_TOKEN` faltante para desplegar `admin-invite-user`.
2. Usuarios Auth QA faltantes o no confirmados.
3. Credenciales E2E faltantes.
4. CSV oficiales WHO/OMS no versionados en repo.
5. `report.exported` no confirmado todavia en `/app/audit`.

## Post RC visible en Vercel

Fecha: 2026-05-21

- La app responde en Vercel y las rutas protegidas redirigen a login sin crash en smoke no autenticado.
- `scripts/module-by-module-qa.mjs` soporta `QA_REMOTE_URL` y HTTPS para validar Vercel sin desplegar.
- `npm audit fix` normal redujo vulnerabilidades, pero quedan pendientes documentados en `docs/npm-audit-review.md`.
- No se cerro QA P0, E2E Enteral, `report.exported`, Edge Function deploy ni Pediatria WHO completa.

## SaaS comercial remoto

Fecha: 2026-05-21

- SaaS Admin queda activado en Supabase remoto de desarrollo para Free, Pro, Clinic/Hospital y Courtesy temporal.
- Migraciones remotas aplicadas: `20260521153000`, `20260521165000`, `20260521172000` y patches `20260521183000`, `20260521184500`, `20260521190000`, `20260521190500`, `20260521191000`.
- `free` queda operativo como plan base mediante RPC `ensure_free_subscription_for_current_user()`.
- `courtesy` exige vencimiento y no se modela como plan comercial principal.
- Billing real sigue desactivado: no Stripe, no tarjetas, no webhooks.
- Marcela (`marcelacruz2000@gmail.com`) existe, esta confirmada, puede iniciar sesion, tiene tenant personal Free, rol `free_member` y plan `free` activo.
- Marcela no tiene `platform_superadmin` ni `saas.manage`; RPC admin de asignacion de rol queda bloqueada para ella.
- ysalek (`ysalek@gmail.com`) esta confirmado como `platform_superadmin` con permisos SaaS en remoto.
- QA visual autenticada local de `/app/saas-admin` con ysalek ya pasa; queda QA P0 con usuarios reales.

## Macrofase 45 - Auditoria funcional integral

Fecha: 2026-05-21

- Se corrigio la brecha P1 de SaaS Admin: la pestana `Usuarios` ahora consume memberships reales mediante RPC protegida y permite busqueda, detalle, roles, estado y permisos efectivos en drawer interno.
- Se actualizaron `qa:saas-admin` y tests unitarios de helpers SaaS para cubrir la lista funcional de usuarios plataforma.
- Se crearon `docs/deep-module-functional-audit.md` y `docs/full-system-module-audit.md`.
- La nueva validacion visual autenticada queda pendiente en este entorno por falta de password/storage state disponible para ysalek y Marcela. La validacion autenticada previa se conserva como evidencia historica.
- No se cerro QA P0, E2E Enteral, `report.exported`, Edge Function deploy ni Pediatria WHO completa.

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

## SaaS Admin - Plan free, suscripciones y cortesias con vencimiento

Estado: aplicado en Supabase remoto de desarrollo.

- Se aplicaron migraciones incrementales para `subscription_plans`, `plan_entitlements`, `tenant_subscriptions` y `subscription_events`.
- Planes comerciales activos: `free`, `pro`, `clinic_hospital`; `courtesy` queda como concesion temporal con vencimiento.
- `free` se asegura por RPC `ensure_free_subscription_for_current_user()` sin autoescalamiento de privilegios.
- `/app/saas-admin` administra planes, suscripciones, cortesias, invitaciones y solicitudes mediante servicios/RPCs protegidos.
- Billing futuro queda deshabilitado: no hay Stripe, cobros, tarjetas ni webhooks.
- Validacion local: `npm run qa:saas-subscriptions`.

Pendiente antes de piloto real:

- SaaS Admin ya fue validado visualmente en local con sesion ysalek: `/app/saas-admin` carga, tabs requeridas visibles y dialogs de plan/cortesia abren sin guardar.
- Marcela Free ya fue validada visualmente en local: login OK, `/app` carga, no ve SaaS Admin y `/app/saas-admin` queda protegido.
- Vercel produccion `https://clinic-metrics-lab.vercel.app` fue actualizado; `/app/saas-admin` ya no devuelve 404 y queda protegido por login/permiso.
- Ejecutar QA Seguridad P0 con usuarios reales no-superadmin.
- Otorgar Courtesy a Marcela solo si se decide probar premium.

## Macrofase 46 - Deploy y cierre autenticado

Fecha: 2026-05-21

- El ultimo frontend con SaaS Admin Usuarios funcional fue desplegado a preview y produccion Vercel.
- Preview: `https://clinic-metrics-nufozysjq-ysaleks-projects.vercel.app`.
- Produccion: `dpl_8ABUwDGLWBFR7JpAfXDjaK2fsPyk`, alias `https://clinic-metrics-lab.vercel.app`.
- Rutas remotas `/login`, `/app`, `/app/saas-admin`, `/app/modules`, `/app/module-settings`, `/app/copilot`, `/app/users` y `/app/audit` responden 200 como SPA/auth gate.
- Se agregaron scripts seguros para desbloquear QA autenticado: `auth:storage`, `qa:security-p0`, `qa:plangate`.
- No se pudo crear storage state de ysalek/Marcela/QA porque faltan passwords en entorno y `.env.local`.
- QA P0 real, `report.exported` y E2E Enteral siguen sin cerrarse.
## Fase 48 - SaaS comercial real

Fecha: 2026-05-21.

- SaaS Admin comercial validado con ysalek como platform admin.
- Marcela queda restaurada a Free al final de la prueba.
- QA Pro, Clinic/Hospital, Courtesy y No Membership fueron creados y validados.
- `20260521221500_fix_saas_subscription_admin_rpc_ambiguity.sql` corrige RPC admin de suscripcion.
- `20260521222500_fix_pro_reports_export_access.sql` alinea Reports para Pro/Courtesy/Clinic.
- QA Seguridad P0 queda cerrado para alcance SaaS admin/planes/RPC; no cierra E2E Enteral ni `report.exported`.
- Billing real sigue desactivado.

## Macrofase 49 - cierre de bloqueos autenticados

Fecha: 2026-05-22.

- `report.exported` queda cerrado con evidencia autenticada: `npm run e2e:report-export`, PDF, Excel y eventos `report.exported` en `audit_logs`.
- E2E Enteral queda cerrado con evidencia autenticada: `npm run e2e:enteral`, plan, edicion, control diario, alerta, PatientDetail, pausa, cierre y auditoria.
- SaaS por plan queda revalidado con usuarios QA: ysalek, Marcela Free, QA Pro, QA Clinic/Hospital, QA Courtesy y QA No Membership.
- Se aplico migracion remota `20260522193500_sync_plan_packs_modules.sql` para sincronizar packs/modulos por plan en tenants existentes.
- Pendiente real: QA P0 clinico profundo por tabla/tenant-cross, Pediatria WHO completa con CSV oficiales, Edge Function `admin-invite-user`, y CRUD autenticado exhaustivo fuera de Enteral/Reports.
## Macrofase 50 - Estado final 2026-05-23

| Area | Estado | Evidencia | Pendiente |
|---|---|---|---|
| SaaS Free | Cerrado funcional | Marcela Free en produccion ve `Panel de mi espacio`, sin Organizacion institucional ni SaaS Admin | Ninguno critico |
| Tema UI | Cerrado funcional | `ThemeToggle`, `useTheme`, tests de tema, produccion validada | Mobile fino |
| SaaS Admin | Funcional | `qa:saas-admin`, `qa:saas-subscriptions`, `qa:functional-auth` | Mutaciones ampliadas con usuarios reales dedicados |
| report.exported | Cerrado | `artifacts/e2e/reports-export/result.json` con `report.generated` y `report.exported` | Mas formatos y reportes por modulo |
| Enteral E2E | Cerrado | `artifacts/e2e/enteral-f9i/result.json` con audit create/update/log/pause/close y RLS anon vacio | Mas escenarios clinicos |
| Seguridad P0 | Listo por evidencia QA | `qa:security-p0` ready; `audit:secrets` limpio | Tenant-cross clinico amplio |
| Pediatria WHO/OMS | Bloqueado | `verify:pilot` | CSV oficiales normalizados |

Validacion final: build, lint, 165 tests, smoke, auditorias, visual parity, verify:pilot, SaaS QA, module QA e internal popups pasaron.
# Macrofase 51 - Pilot Status Update

Fecha local: 2026-05-23.

Estado actualizado:

- Tests unitarios: 166 passed.
- `report.exported`: cerrado con PDF/XLSX y audit logs.
- Enteral E2E: cerrado con create/update/log/pause/close y audit logs.
- Parenteral E2E: cerrado como funcional basico con create/update/log/close y audit logs.
- CRUD critico parcial: Pacientes, Agenda, Mensajes, Alertas, Labs, Foods, Recipes, WeeklyMenu, Pediatria y Deportivo validados con `qa:critical-crud`.
- Mobile/light/dark: validado en produccion con 162 checks.
- Free/Pro/Clinic/Courtesy: PlanGate y rutas protegidas revalidadas.

Pendiente honesto:

- Pediatria WHO/OMS completa requiere CSV oficiales normalizados.
- Parenteral no debe presentarse como avanzado.
- Billing real sigue desactivado.
- Artifacts y storage states no deben versionarse.
