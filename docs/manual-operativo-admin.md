# Manual Operativo Admin

## Gestion de usuarios

Ruta: `/app/users`

Acciones disponibles:

- Ver usuarios/memberships conocidos por la app.
- Ver tenants y roles.
- Crear o actualizar membership de usuario Auth existente.
- Asignar tenant y rol.
- Activar, desactivar y reactivar membership.
- Revisar permisos asociados al rol.
- Ver panel de usuarios QA.

## Creacion de usuarios Auth

La app no crea `auth.users` desde frontend comun.

Opciones seguras:

- Crear usuario desde Supabase Auth Dashboard.
- Desplegar Edge Function `admin-invite-user` y usar la accion de invitacion desde `/app/users`.

La Edge Function debe usar service role solo del lado servidor y validar que el caller tenga permisos `users.manage` o `memberships.manage`.

## Preparar usuarios QA

Usuarios esperados:

- `qa-no-membership@nutri.test`: crear en Auth y no asignar membership.
- `qa-hsm-clinical@nutri.test`: asignar solo HSM con rol clinico no-superadmin.
- `qa-tenant-b-clinical@nutri.test`: asignar solo tenant B real con rol clinico no-superadmin.
- `qa-e2e-hsm@nutri.test`: asignar HSM con permisos suficientes para E2E Enteral.

No crear tenant B de QA sin aprobacion explicita.

## Auditoria esperada

- `membership.create`
- `membership.update`
- `membership.deactivate`
- `membership.reactivate`
- `role.assign`
- `user.invite` o `user.create` si Edge Function esta desplegada.

## Operacion diaria

- Revisar `/app/audit` despues de cambios administrativos.
- Desactivar memberships antes de eliminar accesos fuera del sistema.
- No otorgar `platform_superadmin` a usuarios clinicos QA.
- No usar service role en frontend.
- Antes de produccion, ejecutar QA Seguridad P0 completo.
