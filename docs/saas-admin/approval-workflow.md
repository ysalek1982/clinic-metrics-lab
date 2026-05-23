# Approval Workflow

## Usuario nuevo sin codigo

1. Inicia sesion o crea usuario.
2. Si no tiene membership activo, la app lo envia a `/activate`.
3. Selecciona `Solicitar acceso`.
4. Completa nombre, cargo, mensaje opcional y codigo opcional.
5. La RPC `submit_access_request` crea o actualiza una solicitud `pending`.

Mensaje esperado:

> Solicitud enviada. Un administrador SaaS revisara tu acceso y asignara organizacion, rol y plan.

## Administrador SaaS

1. Entra con `ysalek@gmail.com`.
2. Abre `/app/saas-admin`.
3. Revisa la pestana `Solicitudes`.
4. Para aprobar:
   - selecciona tenant;
   - selecciona rol;
   - selecciona plan: `free`, `courtesy`, `trial`, `professional`, `clinic`, `hospital` o `enterprise`;
   - opcionalmente define fecha fin y nota.
5. La RPC `admin_approve_access_request`:
   - valida platform admin;
   - verifica Auth user existente;
   - crea/actualiza profile;
   - crea/activa `tenant_membership`;
   - asigna `membership_roles`;
   - crea `tenant_membership_grants`;
   - crea/actualiza `tenant_subscriptions`;
   - cambia solicitud a `approved`;
   - audita `user.approved`, `membership.granted` y `subscription.granted`.

## Cuenta gratuita

La cuenta free requiere aprobacion inicial. No se crea tenant ni membership automaticamente desde frontend.

## Rechazo

1. Abrir solicitud.
2. Registrar nota interna.
3. La RPC `admin_reject_access_request` cambia status a `rejected` y audita `user.rejected`.

## No cubierto

- No confirma emails.
- No crea passwords.
- No crea Auth user si no existe.
- No reemplaza QA Seguridad P0 ni E2E autenticado.
