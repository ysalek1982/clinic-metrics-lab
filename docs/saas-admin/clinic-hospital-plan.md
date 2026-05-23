# Plan Clinic/Hospital

`clinic_hospital` es el plan institucional. Esta orientado a clinicas, hospitales y equipos multiusuario.

| Area | Estado |
|---|---|
| Multiusuario y roles | Incluido segun permisos |
| Auditoria | Incluido |
| Enteral/parenteral | Incluido segun modulo y permisos |
| Reportes institucionales | Incluido |
| Gestion de organizacion | Incluida segun rol |
| SaaS Admin de plataforma | No incluido para usuarios normales |
| Billing real | Pendiente de integracion futura |

Estado remoto: aplicado en Supabase de desarrollo. El catalogo `subscription_plans` contiene `clinic_hospital` y sus entitlements.

Pendiente: validar asignacion Clinic/Hospital desde `/app/saas-admin` con sesion ysalek y tenant real. Billing real sigue desactivado.

## Regla comercial corregida

Clinic/Hospital es el plan institucional/equipo.

- Puede mostrar `Organizacion`, `Usuarios`, `Roles`, `Configuracion institucional` y `Auditoria institucional`.
- Requiere rol de tenant adecuado ademas del plan.
- No permite `SaaS Admin` global ni administracion de otros tenants.
- ysalek/platform admin puede subir un tenant Free/Pro a Clinic/Hospital desde SaaS Admin.
## Fase 48 - Validacion Clinic/Hospital

Usuario QA: `qa-clinic@nutri.test`.

- Auth user confirmado en remoto de desarrollo.
- Tenant QA propio con subscription `clinic_hospital`.
- Rol `tenant_owner`.
- Accede a `/app/organization`, `/app/users` y `/app/audit`.
- No ve `/app/saas-admin` global.
- La administracion validada es institucional por tenant, no de plataforma.
