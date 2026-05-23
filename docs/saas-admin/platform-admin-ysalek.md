# Platform Admin: ysalek@gmail.com

Objetivo: `ysalek@gmail.com` debe administrar solicitudes SaaS, tenants, roles, invitaciones y cortesias.

## Estado implementado

- La migracion `20260521153000_saas_admin_approvals_and_courtesy_memberships.sql` no crea passwords.
- Si el Auth user `ysalek@gmail.com` existe, la migracion asegura:
  - profile basico;
  - membership activo en tenant base HSM;
  - rol `platform_superadmin`;
  - permisos SaaS Admin por `role_permissions`.
- Si el Auth user no existe, la migracion no crea credenciales y deja evento `platform_admin.ensure_skipped`.

## Permisos contemplados

- `platform.manage`
- `saas.manage`
- `tenants.manage`
- `subscriptions.manage`
- `invites.manage`
- `access_requests.manage`
- `users.read`
- `users.manage`
- `memberships.read`
- `memberships.manage`
- `roles.read`
- `roles.manage`
- `audit.read`

## No hacer

- No hardcodear passwords.
- No actualizar `auth.users` desde rol `authenticated`.
- No usar `service_role` en frontend.
- No aplicar `db push` real sin autorizacion.

## Si el usuario Auth falta

Crear `ysalek@gmail.com` desde Supabase Dashboard o Edge Function segura. Luego aplicar la migracion autorizada o ejecutar un SQL administrativo equivalente con rol `postgres`.
