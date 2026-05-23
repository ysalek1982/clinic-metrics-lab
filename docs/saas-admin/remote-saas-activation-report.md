# Activacion remota SaaS Admin

Fecha/hora: 2026-05-21, America/La_Paz.

Este reporte documenta la activacion remota solicitada sin exponer secretos. Se leyo `.env.local` solo en memoria para verificar presencia de variables y ejecutar operaciones remotas autorizadas.

## Preflight local

| Validacion | Estado | Evidencia sin secretos | Pendiente |
|---|---|---|---|
| Build | Pasa | `npm run build` finalizado correctamente antes de la activacion. | Repetir al cierre. |
| Lint | Pasa | `npm run lint` finalizado correctamente. | Repetir al cierre. |
| Tests | Pasa | `npm test -- --run`: 152 tests pasan. | Repetir al cierre. |
| QA SaaS Admin | Pasa | `npm run qa:saas-admin`. | QA P0 real pendiente. |
| QA SaaS Subscriptions | Pasa | `npm run qa:saas-subscriptions`. | QA visual Pro/Clinic/Courtesy con usuarios dedicados si se requiere. |
| Audit permissions | Pasa | 0 hallazgos para revision. | QA P0 sigue pendiente con usuarios reales. |
| Audit secrets | Pasa | 0 riesgos frontend/repo; no se imprimen valores. | Mantener secretos fuera de archivos. |

## Credenciales de entorno

| Variable/Recurso | Estado | Uso | Accion |
|---|---|---|---|
| `SUPABASE_DB_PASSWORD` | Presente | Aplicar migraciones remotas con DB URL en memoria. | Usado sin imprimir valor. |
| `SUPABASE_ACCESS_TOKEN` | Presente | Deploy de Edge Function si corresponde. | No se desplego Edge Function en esta fase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Presente | Crear/confirmar Auth user desde script server-side temporal si hiciera falta. | No fue necesario para Marcela. |
| `MARCELA_TEMP_PASSWORD` | Presente | Validar login sin imprimir password. | Usado solo en memoria. |
| `VITE_SUPABASE_URL` | Presente | Validaciones REST/RPC con publishable key. | Usado solo en memoria. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Presente | Validaciones REST/RPC anon y autenticadas. | Usado solo en memoria. |

## Objetos remotos SaaS

| Objeto | Estado remoto | RLS | Evidencia sin secretos | Pendiente |
|---|---|---|---|---|
| `access_requests` | Existe | Protegido | REST anon 200 con 0 filas visibles. | QA P0 con usuarios reales. |
| `tenant_membership_grants` | Existe | Protegido | REST anon 200 con 0 filas visibles. | QA P0 con usuarios reales. |
| `tenant_invites` | Existe | Protegido | Validado por SQL remoto. | QA visual de invitaciones. |
| `subscription_plans` | Existe | Catalogo activo | Planes `free`, `pro`, `clinic_hospital`, `courtesy` presentes. | Ninguno estructural. |
| `plan_entitlements` | Existe | Catalogo activo | Entitlements por plan presentes. | Ajustar limites comerciales si negocio cambia. |
| `tenant_subscriptions` | Existe | Protegido | REST anon 200 con 0 filas visibles. | QA P0 con usuarios reales. |
| `subscription_events` | Existe | Protegido | REST anon 200 con 0 filas visibles. | Revisar auditoria en UI. |
| `tenant_memberships` | Existe | RLS existente | Marcela tiene membership activo Free; ysalek tiene platform role en HSM. | QA P0. |
| `membership_roles` | Existe | RLS existente | Marcela `free_member`; ysalek `platform_superadmin`. | Ninguno. |
| `roles` / `permissions` | Existe | Catalogo autenticado | `saas.manage`, `plans.manage`, `subscriptions.manage` disponibles para ysalek. | Ninguno. |

## RPCs remotas

| RPC | Estado | Evidencia sin secretos | Pendiente |
|---|---|---|---|
| `admin_approve_access_request` | Existe | SQL remoto confirma routine. | QA visual con solicitud real. |
| `admin_reject_access_request` | Existe | SQL remoto confirma routine. | QA visual con solicitud real. |
| `admin_grant_courtesy_membership` | Existe | SQL remoto confirma routine. | Probar con concesion real si se decide. |
| `admin_create_invite_code` | Existe | SQL remoto confirma routine. | QA visual de codigos. |
| `admin_assign_role_to_user` | Existe | Marcela no puede ejecutarlo: `No autorizado para asignar roles.` | QA con ysalek. |
| `admin_remove_role_from_user` | Existe | SQL remoto confirma routine. | QA con ysalek. |
| `admin_update_membership_status` | Existe | SQL remoto confirma routine. | QA con ysalek. |
| `admin_list_effective_permissions` | Existe | Marcela puede consultar permisos propios; no obtiene `saas.manage`. | Revisar UI de permisos con ysalek. |
| `ensure_free_subscription_for_current_user` | Existe y funciona | Marcela obtuvo tenant personal Free activo idempotente. | Ninguno. |

## Migraciones SaaS

| Migracion | Estado | Error si hubo | Correccion | Pendiente |
|---|---|---|---|---|
| `20260521153000_saas_admin_approvals_and_courtesy_memberships.sql` | Aplicada | Ninguno final. | No aplica. | Ninguno. |
| `20260521165000_saas_subscription_plans_and_time_limited_courtesies.sql` | Aplicada | Ninguno final. | No aplica. | Ninguno. |
| `20260521172000_commercial_saas_free_pro_clinic_hospital.sql` | Aplicada | RPC Free requirio fixes posteriores. | Patches `20260521184500`, `20260521190000`, `20260521190500`, `20260521191000`. | Ninguno estructural. |
| `20260521183000_saas_admin_role_permission_rpcs.sql` | Aplicada | Faltaban RPCs de rol/permisos efectivos. | Se agregaron RPCs admin seguras. | QA con ysalek. |

## ysalek@gmail.com platform admin

| Requisito | Estado | Evidencia sin secretos | Pendiente |
|---|---|---|---|
| Auth user existe | Confirmado | SQL remoto encuentra `ysalek@gmail.com`. | Ninguno. |
| Profile/membership | Confirmado | Membership activo en HSM. | Ninguno. |
| Rol `platform_superadmin` | Confirmado | `has_platform_role = true`. | Validar UI manual de `/app/saas-admin`. |
| Permisos SaaS | Confirmado | Tiene `saas.manage`, `plans.manage`, `subscriptions.manage`, `plans.read`, `subscriptions.read`. | Validar operaciones reales desde UI. |

## Marcela

| Requisito | Estado | Evidencia sin secretos | Pendiente |
|---|---|---|---|
| Auth user `marcelacruz2000@gmail.com` | Confirmado | Login con password temporal en memoria OK. | No imprimir password. |
| Email confirmado | Confirmado | Auth login reporta usuario confirmado. | Ninguno. |
| Membership | Confirmado | Membership activo en tenant `Cuenta Free marcelacruz2000`. | Ninguno. |
| Rol | Confirmado | Rol `free_member`; sin `platform_superadmin`. | Cambiar a otro rol solo si negocio lo decide. |
| Plan | Confirmado | `tenant_subscription` `free` activo. | Otorgar Courtesy si se quiere probar premium. |
| SaaS Admin | Bloqueado para usuario normal | No tiene `saas.manage`; RPC admin de asignacion de rol bloqueada. | Validar UI manual si se requiere captura. |

## Validacion visual autenticada 2026-05-21

| Usuario | Ruta | Estado | Evidencia sin secretos | Pendiente |
|---|---|---|---|---|
| `ysalek@gmail.com` | `/app/saas-admin` | Pasa | UI autenticada carga SaaS Admin, tabs Dashboard/Usuarios/Solicitudes/Planes/Suscripciones/Cortesias/Roles/Invitaciones/Auditoria visibles. | Probar guardado real de cambios administrativos cuando se requiera. |
| `ysalek@gmail.com` | `/app/saas-admin` tab Planes | Pasa | Planes Free, Pro y Clinic/Hospital visibles; dialogs internos de plan/cortesia abren y cancelan sin guardar. | Validar cambio real de plan sobre usuario de prueba dedicado. |
| `marcelacruz2000@gmail.com` | `/app` | Pasa | Login real OK; dashboard muestra cuenta Free. | Otorgar Courtesy solo si se decide probar premium. |
| `marcelacruz2000@gmail.com` | `/app/saas-admin` | Pasa | Ruta protegida: no ve SaaS Admin y redirige de forma segura. | Ninguno para Free. |
| `marcelacruz2000@gmail.com` | `/app/modules` | Pasa | PlanGate/estado de plan visible para modulos limitados. | Pruebas visuales con usuarios Pro/Clinic/Courtesy dedicados. |

Artifact: `artifacts/saas-ui-validation/2026-05-21T18-42-13-361Z/authenticated-ui-validation.json` con 21 checks, 0 warnings, 0 failures.

Vercel: produccion actualizada en `https://clinic-metrics-lab.vercel.app`. `/app/saas-admin` ya no devuelve 404; sin sesion redirige a `/login`. Con sesion ysalek, SaaS Admin carga; con Marcela Free, SaaS Admin queda protegido.

Artifacts remotos:

- `artifacts/saas-ui-validation/vercel-2026-05-21T19-31-04-184Z/authenticated-ui-validation-vercel.json`.
- `artifacts/saas-ui-validation/vercel-subscriptions-2026-05-21T19-32-22-479Z/ysalek-subscriptions-validation.json`.

## Bloqueos preservados

- Edge Function deploy: no se desplego `admin-invite-user` en esta fase.
- QA Seguridad P0: pendiente de ejecutar con usuarios QA reales y evidencias.
- E2E Enteral: pendiente de credenciales/storage state E2E.
- `report.exported`: falta evidencia autenticada visible en `/app/audit`.
- Pediatria WHO completa: faltan CSV oficiales WHO/OMS.
- Billing real: desactivado; no Stripe, no tarjetas, no webhooks.

## Fase 47 - Entitlements institucionales remotos

Fecha: 2026-05-21.

| Control | Estado | Evidencia sin secretos | Pendiente |
|---|---|---|---|
| Migracion `20260521194000` | Aplicada | `supabase_migrations.schema_migrations` contiene la version. | Ninguno. |
| Schema cache | Recargado | `NOTIFY pgrst, 'reload schema';` ejecutado contra remoto. | Ninguno. |
| Free institucional | Bloqueado | `plan_entitlements`: `settings.manage=false`, `saas.manage=false`, `users.manage=false`, `audit.read=false`. | Ninguno. |
| Clinic/Hospital institucional | Habilitado | `settings.manage=true`, `users.manage=true`, `audit.read=true`, `saas.manage=false`. | Ajustar limites si cambia negocio. |
| Marcela QA Free | Confirmada | Auth user existe, 1 tenant, membership activo, rol `free_member`, `tenant_subscription=free`, sin `saas.manage`, `users.manage`, `settings.manage` ni `audit.read`. | Mantenerla como QA Free; restaurar si se prueba upgrade. |
| ysalek platform admin | Confirmado por DB | Auth user existe, rol platform, permisos `saas.manage`, `users.manage`, `subscriptions.manage`, `plans.manage`. | Validacion visual y mutaciones con ysalek pendientes por falta de `YSALEK_PASSWORD`/storage state en esta sesion. |
