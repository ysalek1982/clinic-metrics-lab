# Courtesy Memberships

## Definicion

Una cortesia es un grant administrativo registrado en `tenant_membership_grants`.

Planes soportados:

- `free`
- `courtesy`
- `trial`
- `professional`
- `clinic`
- `hospital`
- `enterprise`

Estados:

- `active`
- `expired`
- `cancelled`

## Uso previsto

| Caso | Accion | Evidencia |
|---|---|---|
| Usuario nuevo aprobado | `admin_approve_access_request` crea membership y grant | `membership.granted` en audit_logs |
| Usuario Auth existente | `admin_grant_courtesy_membership` crea/activa membership y grant | `membership.granted` en audit_logs |
| Cortesia cancelada | `admin_revoke_courtesy_membership` marca grant como cancelled | `membership.courtesy_cancelled` |
| Cortesia de tenant | `admin_grant_courtesy_subscription` asigna plan `courtesy` con vencimiento | `subscription_events` y `audit_logs` |

## Reglas

- El usuario Auth debe existir.
- La cortesia no confirma email.
- No se imprime ni guarda password.
- No se usa service role en frontend.
- Toda accion admin requiere `platform_superadmin`.
- El vencimiento comercial del tenant se controla en `tenant_subscriptions.courtesy_ends_at`.

## Pendiente antes de piloto real

- Aplicar migracion.
- Validar con usuarios reales.
- Confirmar auditoria visible en `/app/audit`.
- Definir politica comercial para expiracion y renovacion.
