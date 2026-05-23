# SaaS Admin Diagnosis

Fecha: 2026-05-21

| Elemento | Estado actual | Riesgo | Cambio requerido |
|---|---|---|---|
| Login | Supabase Auth con email/password. Usuarios sin membership quedan marcados como `activationRequired`. | Usuario confirmado puede quedar bloqueado si no tiene tenant. | Mantener redireccion a `/activate` y permitir solicitud de acceso pendiente. |
| Usuario sin membership | `getIdentityContext()` devuelve `activationRequired: true` cuando no hay `tenant_memberships`. | Sin flujo de aprobacion, el usuario dependia de un codigo. | Agregado flujo `submit_access_request` y pantalla de solicitud. |
| Codigo de invitacion | `tenant_invites` y RPC `redeem_tenant_invite` crean profile, membership y rol. | Codigo unico antiguo no registraba grants/cortesia ni usos maximos. | Migracion agrega `plan_code`, `max_uses`, `used_count`, `is_active` y audit. |
| Cargo | `ActivateInvite` manda `p_title`; `redeem_tenant_invite` lo guarda en profile/membership. | Si no hay codigo, cargo no se registraba. | `access_requests.job_title` captura cargo antes de aprobacion. |
| Tenant | El canje de codigo asigna `tenant_id` del invite. | Sin codigo no habia tenant objetivo. | SaaS Admin selecciona tenant al aprobar. |
| Rol | El canje de codigo usa `role_code` del invite. | No habia revision humana para usuarios sin codigo. | SaaS Admin selecciona rol al aprobar. |
| Aprobacion | No existia flujo formal de aprobacion. | Nuevos usuarios no podian entrar sin codigo o intervencion manual. | Agregada tabla `access_requests` y RPCs approve/reject. |
| Membresia de cortesia | No existia registro dedicado de cortesias/trials internos. | No habia trazabilidad de cortesia. | Agregada tabla `tenant_membership_grants`. |
| ysalek@gmail.com | Migraciones previas contemplaban `platform_superadmin` si el Auth user existe. | Si Auth user no existe, no se puede crear sin Dashboard/Edge Function. | Migracion idempotente asegura membership/rol si existe; documenta bloqueo si no existe. |
| Rutas admin | `/app/platform` usa `RequirePlatformAdmin`; `/app/users` usa permiso de tenant. | SaaS Admin necesitaba ruta de plataforma sin depender de tenant activo. | Agregada `/app/saas-admin` bajo `RequirePlatformAdmin`. |
| Service role frontend | No se encontro service role en frontend; invitacion Auth depende de Edge Function. | Usar service role en `src/` romperia seguridad. | SaaS Admin usa Supabase client normal + RPC/RLS; no service role frontend. |
| Auditoria | `audit_logs` existe y varias RPCs ya auditan. | Aprobacion/rechazo no tenia eventos propios. | RPCs escriben `access_request.submitted`, `user.approved`, `user.rejected`, `membership.granted`, `invite.created`, `invite.revoked`. |

## Bloqueo real

Crear o confirmar Auth users sigue requiriendo Supabase Dashboard, Edge Function desplegada o SQL ejecutado con rol administrativo. El frontend no puede ni debe usar `service_role`.
