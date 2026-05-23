# Cortesias con vencimiento

Las cortesias se manejan en dos niveles:

1. Cortesia de usuario/membership: `tenant_membership_grants`.
2. Cortesia de tenant/suscripcion: `tenant_subscriptions` con `plan_code = courtesy`, `status = courtesy` y `courtesy_ends_at`.

Flujo:

1. Platform admin abre `/app/saas-admin`.
2. Selecciona tenant.
3. Define duracion rapida: 7, 15, 30 o 90 dias, o fecha personalizada.
4. El RPC crea/actualiza la suscripcion y registra evento.
5. Al cancelar, la suscripcion vuelve a `free`.

Cuando vence:

- La UI debe mostrar "Cortesia vencida".
- Las funciones premium deben quedar bloqueadas por `PlanGate`/`subscriptionAccess`.
- Los datos del tenant no se borran.
- La plataforma puede extender o cancelar.

Pendiente:

- Automatizacion backend para convertir cortesias vencidas a `expired` o `free` sin intervencion manual.
- Validacion visual con usuario real despues de otorgar una cortesia.
- Automatizacion backend para rebajar/expirar cortesias vencidas sin intervencion manual.

Estado remoto 2026-05-21:

- Migraciones aplicadas.
- Plan `courtesy` existe como concesion temporal.
- `tenant_subscriptions` soporta `courtesy_ends_at`/`ends_at`.
- Marcela quedo en Free; no se le otorgo Courtesy en esta fase.
