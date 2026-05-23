# Administracion de roles y permisos SaaS

La administracion de usuarios, roles, permisos, tenants y planes queda reservada a `platform_superadmin` o permisos equivalentes.

| Permiso | Uso | Usuario normal |
|---|---|---|
| `saas.manage` | Acceso a SaaS Admin. | No |
| `users.manage` | Gestion de usuarios/memberships. | No |
| `memberships.manage` | Activar/desactivar memberships. | No |
| `roles.manage` | Asignar/quitar roles. | No |
| `permissions.manage` | Gestionar permisos. | No |
| `tenants.manage` | Gestionar tenants. | No |
| `subscriptions.manage` | Asignar planes/cortesias. | No |
| `plans.manage` | Administrar catalogo de planes. | No |
| `invites.manage` | Crear/desactivar invitaciones. | No |
| `audit.read` | Revisar auditoria. | Depende del rol |

## Estado remoto

Validado en Supabase remoto de desarrollo:

- `ysalek@gmail.com` tiene `platform_superadmin`.
- `ysalek@gmail.com` tiene `saas.manage`, `plans.manage` y `subscriptions.manage`.
- `marcelacruz2000@gmail.com` no tiene `platform_superadmin`.
- `marcelacruz2000@gmail.com` no tiene `saas.manage`.
- Un intento de Marcela de ejecutar `admin_assign_role_to_user` queda bloqueado por RPC.
- UI autenticada confirma que Marcela no ve SaaS Admin en sidebar y `/app/saas-admin` directo queda protegido.
- UI autenticada confirma que ysalek carga `/app/saas-admin` y ve tabs de gestion SaaS.

Pendiente: QA P0 completo con usuarios reales no-superadmin y evidencia UI.
