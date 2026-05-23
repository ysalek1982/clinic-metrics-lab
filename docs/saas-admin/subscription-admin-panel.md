# Panel SaaS de planes y suscripciones

`/app/saas-admin` queda preparado para administracion de plataforma. La ruta debe estar protegida por `platform_superadmin`/`saas.manage`.

## Tabs

- Dashboard.
- Usuarios.
- Solicitudes.
- Planes.
- Suscripciones.
- Cortesias.
- Roles y permisos.
- Invitaciones.
- Auditoria.

## Acciones

| Accion | Estado local | Seguridad |
|---|---|---|
| Aprobar solicitud | Implementado via servicio/RPC. | RPC valida platform admin. |
| Rechazar solicitud | Implementado via servicio/RPC. | RPC valida platform admin. |
| Asignar Free | Preparado. | No otorga permisos admin. |
| Asignar Pro | Preparado. | Requiere platform admin. |
| Asignar Clinic/Hospital | Preparado. | Requiere platform admin. |
| Otorgar Courtesy | Preparado con vencimiento requerido. | Requiere platform admin. |
| Cancelar/expirar Courtesy | Preparado. | No borra datos clinicos. |
| Crear invitacion | Preparado. | RPC valida platform admin. |
| Ver permisos efectivos | Preparado. | Solo admin autorizado. |

## Estado remoto

- Migraciones SaaS aplicadas.
- `ysalek@gmail.com` confirmado con `platform_superadmin` y `saas.manage`.
- Marcela confirmada con rol `free_member` y plan `free`.
- Marcela no tiene `saas.manage` ni `platform_superadmin`.
- RPC admin de asignacion de rol bloquea a Marcela con `No autorizado para asignar roles.`

## Validacion UI autenticada

Ejecutada el 2026-05-21 contra `http://127.0.0.1:8082`.

| Validacion | Resultado | Evidencia |
|---|---|---|
| ysalek abre SaaS Admin | Pasa | `/app/saas-admin` carga con sesion real y tenant HSM seleccionado. |
| Tabs requeridas | Pasa | Dashboard, Usuarios, Solicitudes, Planes, Suscripciones, Cortesias, Roles y permisos, Invitaciones, Auditoria. |
| Planes visibles | Pasa | Free, Pro y Clinic/Hospital en tab Planes. |
| Dialogs internos | Pasa | Asignar plan, Cortesia tenant y Dar cortesia abren como dialogs y se cancelan sin guardar. |
| Marcela Free bloqueada | Pasa | No ve SaaS Admin y acceso directo redirige seguro. |

Pendiente: probar una aprobacion/cambio real con usuario de prueba dedicado y deploy frontend autorizado para Vercel.
## Fase 48 - Panel validado

El panel `/app/saas-admin` fue validado en produccion con sesion ysalek:

- Tabs visibles: Dashboard, Usuarios, Solicitudes, Planes, Suscripciones, Cortesias, Roles y permisos, Invitaciones y Auditoria.
- Tab Usuarios lista memberships reales.
- Busqueda por email encuentra Marcela.
- Drawer de usuario muestra tenant, plan, roles y permisos efectivos.
- Acciones internas disponibles: Bajar a Free, Subir a Pro, Subir a Clinic/Hospital, Dar cortesia.
- Mutaciones reales sobre Marcela fueron ejecutadas y auditadas; Marcela queda Free al final.
