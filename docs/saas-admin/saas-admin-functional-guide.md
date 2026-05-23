# SaaS Admin Functional Guide

## Que es

SaaS Admin es el panel para que un `platform_superadmin` apruebe usuarios nuevos, asigne tenant, asigne rol y otorgue planes `free`, `pro`, `clinic_hospital` o concesiones `courtesy` temporales sin usar service role en frontend.

Ruta: `/app/saas-admin`

Permiso: `saas.manage` o rol `platform_superadmin`.

## Capacidades

| Capacidad | Estado | Fuente de datos | Accion | Limitacion |
|---|---|---|---|---|
| Solicitudes de acceso | Implementado local | `access_requests` | Aprobar o rechazar | Requiere migracion aplicada |
| Aprobar usuario | Implementado local | RPC `admin_approve_access_request` | Crea profile, membership, role y grant | Auth user debe existir |
| Rechazar usuario | Implementado local | RPC `admin_reject_access_request` | Marca solicitud como rejected | No elimina Auth user |
| Codigos de invitacion | Implementado local | `tenant_invites` | Crear/desactivar codigos | Requiere migracion aplicada |
| Cortesias | Implementado local | `tenant_membership_grants` | Dar/cancelar cortesia | Auth user debe existir |
| Planes | Implementado local | `subscription_plans` + `plan_entitlements` | Ver beneficios y limites | Edicion de precios pendiente |
| Suscripciones | Implementado local | `tenant_subscriptions` | Asignar plan, extender/cancelar cortesia | Requiere migracion aplicada |
| Auditoria | Implementado local | `audit_logs` | Registra eventos SaaS | Verificacion remota requiere usuarios reales |

## Flujo esperado

1. Usuario crea/confirma Auth user en Supabase.
2. Si no tiene membership, entra a `/activate`.
3. Puede canjear codigo o enviar solicitud.
4. `ysalek@gmail.com` entra a `/app/saas-admin`.
5. Revisa solicitudes pendientes.
6. Aprueba con tenant, rol y plan `free`, `pro`, `clinic_hospital` o `courtesy` con vencimiento.
7. El usuario refresca sesion y entra al tenant asignado.

## Planes comerciales

- `free`: acceso basico individual, sin SaaS Admin ni premium avanzado.
- `pro`: profesional individual con funcionalidad principal.
- `clinic_hospital`: institucional, multiusuario, auditoria y soporte hospitalario.
- `courtesy`: concesion temporal con vencimiento; no es plan comercial principal.

La migracion comercial agrega `ensure_free_subscription_for_current_user()` para Free por defecto sin privilegios admin. Esta pendiente aplicar y validar en Supabase remoto.

## Billing

Pagos en linea quedan preparados solo como abstraccion futura. No hay Stripe, no hay cobros, no hay tarjetas y no hay webhooks activos.

## Seguridad

- Frontend usa Supabase client normal.
- Operaciones sensibles se ejecutan por RPC `security definer`.
- Cada RPC valida `auth.uid()` y `public.is_platform_superadmin()`.
- El frontend no crea Auth users ni maneja service role.

## Pendiente externo

- Aplicar migraciones con `npx supabase db push` cuando exista `SUPABASE_DB_PASSWORD`.
- Crear/confirmar Auth users desde Dashboard o Edge Function desplegada.
- Validar `ysalek@gmail.com` como `platform_superadmin`.
- Crear/confirmar `marcelacruz2000@gmail.com` y asignar Free o Courtesy sin permisos SaaS.
