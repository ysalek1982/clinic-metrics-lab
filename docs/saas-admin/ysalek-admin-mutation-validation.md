# Validacion de mutaciones SaaS con ysalek

Fecha: 2026-05-21

Alcance: validacion remota en Supabase/Vercel con sesion autenticada de `ysalek@gmail.com` generada server-side sin imprimir secretos. No se guardan passwords en archivos y los storage states no se versionan.

| Accion | Estado | Evidencia sin secretos | Audit log | Estado final |
|---|---|---|---|---|
| Abrir SaaS Admin | Pasa | `/app/saas-admin` carga con tabs Dashboard, Usuarios, Solicitudes, Planes, Suscripciones, Cortesias, Roles y permisos, Invitaciones y Auditoria. | No aplica | ysalek ve SaaS Admin. |
| Buscar Marcela en Usuarios | Pasa | Tab Usuarios lista `marcelacruz2000@gmail.com`, plan Free, rol `free_member` y drawer de detalle. | No aplica | Marcela visible como usuario Free. |
| Abrir detalle de Marcela | Pasa | Drawer interno muestra email, tenant, roles, permisos efectivos, acciones Subir a Pro y Dar cortesia. | No aplica | Sin cambios destructivos al abrir/cerrar. |
| Subir Marcela a Pro | Pasa | RPC autenticado `admin_assign_tenant_plan` cambia subscription a `pro`; rol profesional se asigna temporalmente para validar acceso Pro. | `subscription.assigned`, `role.assigned` | Validado y luego restaurado. |
| Validar Marcela Pro | Pasa | UI Marcela muestra plan Pro y no muestra SaaS Admin. | No aplica | Estado temporal validado. |
| Bajar Marcela a Free | Pasa | RPC autenticado restaura `tenant_subscriptions.plan_code = free`. | `subscription.assigned`, `role.removed` | Marcela vuelve a Free. |
| Dar Courtesy 7 dias | Pasa | RPC autenticado `admin_grant_courtesy_subscription` cambia subscription a `courtesy` con vencimiento futuro. | `subscription.assigned`, `courtesy.granted` | Estado temporal validado. |
| Cancelar Courtesy | Pasa | RPC autenticado `admin_cancel_courtesy_subscription` restaura subscription a Free. | `courtesy.cancelled` | Marcela queda Free. |

Estado final verificado:

- Marcela queda con `plan_code = free`.
- Marcela queda con rol `free_member`.
- Marcela no tiene `saas.manage`.
- Marcela no ve SaaS Admin.
- Billing real sigue desactivado.

Artifacts locales no versionables:

- `artifacts/saas-ui-validation/fase48-marcela-mutations-*.json`
- `artifacts/saas-ui-validation/fase48-ysalek-users-tab-*.json`
