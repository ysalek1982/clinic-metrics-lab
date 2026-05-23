# Route health dashboard local

Fecha: 2026-05-13

Fuente: `npm run smoke:routes`, `npm run audit:ui`, `npm run audit:permissions`, `npm run audit:demo`.

| Ruta | Render | UX | Acciones | Permisos | Demo risk | Estado final | Pendiente |
|---|---|---|---|---|---|---|---|
| `/app` | PASS local | Login visible sin sesion | Sin riesgo alto | Ruta protegida | none | Verde local | Smoke autenticado |
| `/app/copilot` | PASS local | Command center contextual con tareas, timeline y consulta local; login sin sesion en smoke local | Quick links reales o deshabilitados | Ruta protegida por `ai.assist`; datos por RLS/backend | none | Amarillo autenticado pendiente | Smoke autenticado con usuarios reales y permiso `ai.assist` |
| `/app/patients` | PASS local | Redirige/login sin sesion | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Usuarios QA |
| `/app/anthropometry` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/screening` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/plans` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/agenda` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/messages` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/alerts` | PASS local | ModuleState reforzado | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/reports` | PASS local | ModuleState reforzado | Export requiere evidencia audit | Guard UI/reportes | none | Amarillo autenticado pendiente | `report.exported` en audit |
| `/app/labs` | PASS local | Sin ErrorBoundary local | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/foods` | PASS local | Sin ErrorBoundary local | Guardado deshabilita submit | Backend/RLS | none | Amarillo autenticado pendiente | QA P0 |
| `/app/recipes` | PASS local | Sin ErrorBoundary local | Guardado deshabilita submit | Backend/RLS | none | Amarillo autenticado pendiente | QA P0 |
| `/app/weekly-menu` | PASS local | Sin ErrorBoundary local | Cerrar/guardar gateado | UI + backend/RLS | none | Amarillo autenticado pendiente | QA P0 |
| `/app/pediatric-curves` | PASS local | Referencia incompleta controlada | Sin z-score falso | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | CSV WHO oficiales |
| `/app/pack/enteral/cockpit` | PASS local | Render visible validado localmente | Pausar/cerrar gateado | UI + backend/RLS | none | Amarillo autenticado pendiente | E2E Enteral |
| `/app/pack/parenteral` | PASS local | Basico controlado | Cerrar gateado | UI + backend/RLS | none | Amarillo autenticado pendiente | E2E opcional |
| `/app/somatocarta` | PASS local | Somatocarta condicionada | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Datos reales suficientes |
| `/app/users` | PASS local | Admin memberships funcional local/remoto parcial aceptado | Invite depende Edge Function | users.manage/memberships.manage | none | Amarillo autenticado pendiente | Deploy Edge Function/QA users |
| `/app/saas-admin` | PASS local protegido | UI para solicitudes, codigos, cortesias, planes y suscripciones | Acciones por RPC; migraciones pendientes | `platform_superadmin` / `saas.manage` / `subscriptions.manage` | none | Amarillo autenticado pendiente | Aplicar migraciones y validar con ysalek |
| `/app/audit` | PASS local | ModuleState reforzado | Sin riesgo alto | RLS pendiente QA P0 | none | Amarillo autenticado pendiente | Eventos autenticados |
| `/app/settings` | PASS local | Sin ErrorBoundary local | Proximamente donde aplica | UI + backend/RLS | none | Amarillo autenticado pendiente | Smoke autenticado |
| `/app/organization` | PASS local | Sin ErrorBoundary local | Crear tenant protegido | Platform/admin guard | none | Amarillo autenticado pendiente | Revision admin |

Leyenda: Verde local = validado sin credenciales; Amarillo autenticado pendiente = requiere storage state/credenciales; Rojo bloqueado = no ejecutable localmente.

## Verificacion Post RC en Vercel

Fecha: 2026-05-21

| Ruta | Render remoto | UX remoto | Acciones | Estado final | Pendiente |
|---|---|---|---|---|---|
| `/login` | PASS | Login visible | Sin acciones de riesgo | Verde remoto | Login con usuario real |
| `/app` y rutas protegidas | PASS | Redirigen a login sin crash | 0 acciones alto/medio en QA no autenticado | Amarillo autenticado pendiente | Storage state y usuarios QA |
| `/app/modules` | PASS protegido | Login seguro sin ErrorBoundary | Sin acciones de riesgo en no autenticado | Amarillo autenticado pendiente | Validar UI autenticada |
| `/app/module-settings` | PASS protegido | Login seguro sin ErrorBoundary | Persistencia pendiente no se promete | Amarillo autenticado pendiente | Validar UI autenticada |
| `/app/saas-admin` | PASS protegido | Login seguro sin ErrorBoundary | Requiere platform admin real | Amarillo autenticado pendiente | Revalidar tab Usuarios con ysalek autenticado |
| `/app/copilot` | PASS protegido | Login seguro sin ErrorBoundary | No se simula IA generativa | Amarillo autenticado pendiente | Validar permiso `ai.assist` |

Evidencia: `QA_REMOTE_URL=https://clinic-metrics-lab.vercel.app node scripts/module-by-module-qa.mjs`, `SMOKE_BASE_URL=https://clinic-metrics-lab.vercel.app npm run smoke:routes`, `UI_AUDIT_BASE_URL=https://clinic-metrics-lab.vercel.app npm run audit:ui`.

## SaaS comercial remoto

Fecha: 2026-05-21

| Ruta/area | Estado local | Estado remoto | Pendiente |
|---|---|---|---|
| `/app/saas-admin` | PASS local; tabs Dashboard, Usuarios, Solicitudes, Planes, Suscripciones, Cortesias, Roles y permisos, Invitaciones, Auditoria. Usuarios ahora lista memberships reales por RPC protegida. | Protegido por login; produccion Vercel ya no devuelve 404; ysalek validado previamente como platform admin. | Repetir visual autenticado de Usuarios con storage state/password. |
| PlanGate | PASS local | Validado previamente con Marcela Free en remoto; Pro/Clinic/Courtesy quedan por usuario QA dedicado. | Validar Pro/Clinic/Courtesy visualmente. |
| Free default | RPC `ensure_free_subscription_for_current_user()` activa | Aplicado remoto en desarrollo. | Mantener sin autoescalamiento. |
| Marcela | Confirmada con plan Free y rol `free_member` | Login remoto validado previamente; no ve SaaS Admin. | Revalidar tras cada deploy frontend. |

## Macrofase 45

| Ruta/area | Render | UX | Acciones | Estado final | Pendiente |
|---|---|---|---|---|---|
| `/app/saas-admin` Usuarios | PASS local | Busqueda y detalle funcionales para platform admin | RPCs protegidas para permisos efectivos, rol y estado | Verde local condicionado | Validacion autenticada actual bloqueada por falta de storage state/password |
| QA modulo por modulo | PASS no autenticado | Auth gate esperado sin sesion | Persona incluida en artifact | Verde no autenticado | Ejecutar persona `ysalek` y `marcela-free` |

## Macrofase 46 - produccion

| Ruta | Render produccion | UX produccion | Estado final | Pendiente |
|---|---|---|---|---|
| `/login` | PASS 200 | Login SPA visible | Verde remoto no autenticado | Login real con storage state |
| `/app` | PASS 200 | Auth gate esperado sin sesion | Verde remoto no autenticado | Marcela/ysalek storage |
| `/app/saas-admin` | PASS 200 | Auth gate esperado sin sesion; build nuevo desplegado | Verde remoto no autenticado | ysalek tab Usuarios autenticado |
| `/app/modules` | PASS 200 | Auth gate esperado sin sesion | Verde remoto no autenticado | PlanGate autenticado |
| `/app/module-settings` | PASS 200 | Auth gate esperado sin sesion | Verde remoto no autenticado | Perfil con sesion |
| `/app/copilot` | PASS 200 | Auth gate esperado sin sesion | Verde remoto no autenticado | Permiso `ai.assist` |
| `/app/users` | PASS 200 | Auth gate esperado sin sesion | Verde remoto no autenticado | Usuarios/roles autenticado |
| `/app/audit` | PASS 200 | Auth gate esperado sin sesion | Verde remoto no autenticado | `report.exported` |

## Macrofase 49 - rutas autenticadas

| Ruta/grupo | Usuario | Estado | Evidencia | Pendiente |
|---|---|---|---|---|
| SaaS rutas por plan | ysalek, Marcela, QA Pro, QA Clinic, QA Courtesy, QA No Membership | PASS 46/46 | `artifacts/authenticated-functional/authenticated-functional-2026-05-22T19-57-06-969Z.json` | CRUD profundo restante |
| `/app/pack/enteral/cockpit` | QA Clinic | PASS E2E | `artifacts/e2e/enteral-f9i/result.json` | Limpieza QA opcional |
| `/app/reports` + `/app/audit` | QA Clinic | PASS export/audit | `artifacts/e2e/reports-export/result.json` | Ninguno |
## Macrofase 50 - Route Health Update

| Ruta | Estado | Evidencia | Pendiente |
|---|---|---|---|
| `/app` | Passed | Marcela Free en produccion: Dashboard personal, sin ErrorBoundary | Ninguno critico |
| `/app/tenants` | Passed | Copy `Mis espacios`, sin link SaaS para no admin | Ninguno critico |
| `/app/saas-admin` | Passed para platform admin, bloqueado para Free | QA SaaS y auth QA | Mutaciones ampliadas |
| `/app/reports` | Passed | E2E report export con PDF/XLSX y audit real | Mas reportes |
| `/app/pack/enteral/cockpit` | Passed | E2E remoto Enteral | Mas escenarios |
| Resto rutas principales | Passed por smoke/module QA | module-by-module QA artifact | CRUD profundo |
# Macrofase 51 - Route Health Update

Fecha local: 2026-05-23.

Rutas criticas revalidadas en produccion con contenido autenticado y mobile/light/dark:

- `/app`
- `/app/account`
- `/app/saas-admin`
- `/app/patients`
- `/app/reports`
- `/app/agenda`
- `/app/alerts`
- `/app/recipes`
- `/app/weekly-menu`
- `/app/pack/enteral/cockpit`
- `/app/pack/parenteral`
- `/app/modules`

Evidencia:

- `artifacts/mobile/mobile-responsive-2026-05-23T13-43-42-755Z.json`.
- `artifacts/authenticated-functional/authenticated-functional-2026-05-23T13-43-40-940Z.json`.

Resultado: sin pantalla blanca, sin ErrorBoundary, sin overflow horizontal de documento.
