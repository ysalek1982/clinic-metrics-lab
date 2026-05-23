# Matriz de módulos para piloto Nutri

Estado al 2026-05-11. Esta matriz no cierra bloqueos que requieren credenciales, usuarios QA o referencias oficiales.

| Módulo | Estado | Fuente de datos | RLS | Auditoría | Pendiente |
|---|---|---|---|---|---|
| Copilot clínico | Funcional contextual local | Supabase via hooks existentes y reglas locales; tareas/timeline derivados | Ruta protegida por `ai.assist`; datos por servicios tenant-scoped/RLS | Solo lectura; no crea eventos por consulta contextual | Validar con sesión autenticada, usuarios QA y datos reales |
| Dashboard | Funcional para piloto | Supabase con estados fallback controlados | Aplica por servicios tenant-scoped | Eventos visibles vía `audit_logs` | Smoke autenticado pendiente |
| Pacientes | Funcional | Supabase `patients` y datos clínicos asociados | Activa en tablas clínicas | Acciones clínicas auditadas según servicio | QA tenant-cross pendiente |
| Evaluaciones | Funcional parcial fuerte | Supabase `clinical_assessments`, `encounters` | Activa | Eventos clínicos relevantes | QA multi-tenant pendiente |
| Planes | Funcional | Supabase `nutrition_plans` | Activa | Eventos de planes según flujo | QA multi-tenant pendiente |
| Labs | Cerrado funcionalmente | Supabase `lab_orders`, `lab_results` | Activa | Eventos de labs/audit | QA multi-tenant pendiente |
| Alertas | Cerrado funcionalmente | Supabase y alertas derivadas reales | Activa | Acknowledgements y eventos derivados | QA multi-tenant pendiente |
| Agenda | Cerrada funcionalmente | Supabase `appointments` | Activa | Eventos de agenda | QA multi-tenant pendiente |
| Mensajes | Cerrado funcionalmente | Supabase `message_threads`, `messages`, receipts | Activa | `message_thread.*`, `message.sent` | QA multi-tenant pendiente |
| Alimentos | Cerrado funcional y visual | Supabase `food_groups`, `food_items` | Activa para tenant-scoped; catálogo global controlado | Acciones de gestión si aplica | Completar catálogo real según operación |
| Recetas | Cerrado funcional y visual | Supabase `recipes`, `recipe_ingredients` | Activa | `recipe.create/update/archive` | QA multi-tenant pendiente |
| Menú semanal | Cerrado funcional y visual | Supabase `weekly_menus`, `weekly_menu_items` | Activa | `weekly_menu.*` | QA multi-tenant pendiente |
| Reportes | Funcional | Supabase + `report_runs` | Activa | `report.generated`, `report.printed`; `report.exported` pendiente de evidencia | Confirmar `report.exported` en `/app/audit` autenticado |
| Pediatría | Funcional con referencia incompleta controlada | Supabase `pediatric_growth_records/results`; referencias incompletas | Activa | Medición y cálculo auditables | CSV oficiales WHO/OMS para z-score/percentil real |
| Enteral | Funcional E2E aceptado previamente; E2E automatizado pendiente por credenciales | Supabase `enteral_plans`, `enteral_daily_logs` | Activa; anon validado | `enteral_plan.*`, `enteral_daily_log.create` | Reproducir E2E con `E2E_EMAIL/E2E_PASSWORD` |
| Parenteral | Funcional básico controlado, no avanzado | Supabase `parenteral_plans`, `parenteral_monitoring_logs` | Activa; anon validado | `parenteral_plan.*`, `parenteral_log.create` | No marcar como parenteral avanzado |
| Deportivo/Somatocarta | Funcional condicionado a datos antropométricos suficientes | Supabase `sports_profiles`, evaluaciones deportivas | Activa | `sports_profile.*`, `sports_assessment.*`, reportes | No inventar somatotipo si faltan datos |
| Usuarios/Roles | Funcional para memberships existentes | Supabase RPC admin, roles, permisos, memberships | RLS/RPC autorizados | `membership.*`, `role.assign` | Deploy Edge Function para invitar Auth |
| SaaS Admin | Funcional remoto/base y reforzado localmente | `access_requests`, `tenant_invites`, `tenant_membership_grants`, `subscription_plans`, `plan_entitlements`, `tenant_subscriptions`, RPCs admin y listado real de memberships en `Usuarios`; planes `free`, `pro`, `clinic_hospital` y `courtesy` temporal | RLS/RPC con `platform_superadmin`; Marcela Free sin `saas.manage`; sin service role frontend | `access_request.*`, `user.approved`, `user.rejected`, `membership.granted`, `role.assigned`, `role.removed`, `subscription.*`, `courtesy.*`, `invite.*` | Revalidar UI autenticada tras esta mejora cuando haya password/storage state disponible; QA Seguridad P0 sigue pendiente |
| Auditoría | Funcional de lectura | Supabase `audit_logs` | Activa | N/A | Exportar auditoría permanece Próximamente |
| Exportaciones | Parcial real | PDF/XLSX locales desde datos autorizados | Respeta datos ya filtrados por RLS | `report.exported` pendiente de evidencia visible | Cerrar Fase 18A con sesión autenticada |

## Modulos de organizacion y configuracion post RC

| Modulo | Estado | Fuente de datos | RLS | Auditoria | Pendiente |
|---|---|---|---|---|---|
| Centro de modulos | Funcional local | `moduleRegistry` local, rutas reales y estados honestos | Requiere sesion y tenant como ruta app | Solo lectura | Validar con usuario real en Vercel |
| Configuracion de modulos | Funcional local de visualizacion | `operationalProfiles` y registry local | Requiere sesion y tenant como ruta app | No persiste cambios | Persistencia tenant-scoped pendiente si se aprueba DB/RLS |
| Perfiles operativos | Funcional local | Configuracion local no persistente | No aplica a datos clinicos | No crea eventos | Conectar a settings remoto solo con migracion/RLS aprobada |

Nota post RC 2026-05-21: Vercel responde en rutas protegidas sin crash en smoke no autenticado. QA autenticado sigue pendiente.

## Macrofase 46

| Modulo | Ruta | Estado | Evidencia | Pendiente |
|---|---|---|---|---|
| SaaS Admin | `/app/saas-admin` | Deploy produccion actualizado con tab Usuarios funcional. | `dpl_8ABUwDGLWBFR7JpAfXDjaK2fsPyk`, alias `https://clinic-metrics-lab.vercel.app`. | Revalidar con ysalek autenticado. |
| PlanGate | Multiples rutas | Matriz generada pero bloqueada visualmente. | `docs/plangate-validation-matrix.md`. | Storage states por plan. |
| QA P0 | SaaS/clinical | Precondiciones documentadas. | `docs/qa-security-p0-real.md`. | Storage states por perfil. |

## Macrofase 49

| Modulo | Ruta | Estado | Evidencia | Pendiente |
|---|---|---|---|---|
| SaaS planes | Multiples | Free/Pro/Clinic/Courtesy/No Membership revalidados. | `qa:functional-auth` 46 rutas, 0 fallos. | Expiracion Courtesy. |
| Enteral | `/app/pack/enteral/cockpit` | Cerrado con flujo real. | `npm run e2e:enteral`; audit logs create/update/log/pause/close. | Limpiar QA opcional. |
| Reports export | `/app/reports` | Cerrado con PDF/XLSX y auditoria. | `npm run e2e:report-export`; `report.exported` PDF/XLSX. | Ninguno. |
| QA P0 clinico | varias tablas | Parcial. | Scripts y storage states listos. | Tenant-cross clinico profundo y CRUD no hospitalario. |
## Macrofase 50 - Matrix Update

| Modulo | Estado | Evidencia | Pendiente |
|---|---|---|---|
| SaaS Free/Pro/Clinic/Courtesy | Funcional | QA autenticada, PlanGate, security P0 | Billing futuro |
| UI tema | Funcional | Theme tests, Browser local/remoto | Mobile fino |
| Reports export | Cerrado | report.generated/report.exported auditados | Ampliar cobertura |
| Enteral | Cerrado | E2E auditado, RLS anon vacio | Escenarios adicionales |
| Pediatria WHO | Bloqueado | verify:pilot | CSV oficiales |
| Modulos CRUD restantes | Operativos por ruta | module-by-module QA | CRUD manual profundo |
# Macrofase 51 - Module Matrix Update

Fecha local: 2026-05-23.

| Modulo | Estado actualizado | Evidencia | Pendiente |
|---|---|---|---|
| Pacientes | Validado CRUD QA | `qa:critical-crud` | Datos reales |
| Agenda | Validado CRUD QA | `qa:critical-crud` | Recurrentes |
| Mensajes | Validado CRUD QA | `qa:critical-crud` | Asignacion avanzada |
| Alertas | Validado acciones QA | `qa:critical-crud` | Masiva amplia |
| Labs | Validado resultado QA | `qa:critical-crud` | Interpretacion clinica amplia |
| Foods / Recipes / WeeklyMenu | Validado CRUD QA | `qa:critical-crud` | Dataset amplio |
| Enteral | E2E cerrado | `e2e:enteral` | Escenarios clinicos reales |
| Parenteral | E2E cerrado basico | `e2e:parenteral` | Avanzado pendiente |
| Pediatria | Seguro sin z-score falso | `qa:critical-crud` | CSV WHO/OMS |
| Deportivo | Validado snapshot QA | `qa:critical-crud` | Mas mediciones |
| SaaS/PlanGate | Validado | `qa:functional-auth`, `qa:plangate` | Billing futuro |
