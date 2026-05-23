# Plan Pro

`pro` es el plan comercial para profesional individual. Habilita la operacion funcional principal de Nutri sin convertir al usuario en administrador SaaS.

| Area | Estado |
|---|---|
| Dashboard, pacientes, antropometria, agenda, labs, reportes | Incluido |
| Copilot contextual | Incluido segun permisos del usuario |
| Nutricion operativa | Incluido |
| Pediatria/deportivo | Incluido segun permisos y datos disponibles |
| Usuarios/roles institucionales | No incluido por defecto |
| SaaS Admin | No incluido |
| Pagos reales | No integrados |

Estado remoto: aplicado en Supabase de desarrollo. El catalogo `subscription_plans` contiene `pro` y sus entitlements.

Pendiente: validar upgrade/asignacion Pro desde `/app/saas-admin` con sesion ysalek y usuario real. Billing real sigue desactivado.

## Regla comercial corregida

Pro es individual completo. Puede habilitar modulos premium operativos, pero no convierte al usuario en administrador institucional ni de plataforma.

- No incluye `saas.manage`.
- No incluye `settings.manage` institucional por defecto.
- No incluye `users.manage` ni `audit.read` institucional por defecto.
- ysalek/platform admin puede subir un Free a Pro desde el drawer de usuario o desde Suscripciones.
## Fase 48 - Validacion Pro

Usuario QA: `qa-pro@nutri.test`.

- Auth user confirmado en remoto de desarrollo.
- Tenant QA propio con subscription `pro`.
- Rol `clinical_nutritionist`.
- Accede a `/app` y `/app/reports`.
- No accede a `/app/organization` institucional.
- No ve `/app/saas-admin`.

Correccion aplicada: Pro y roles profesionales recibieron `reports.export` para que el centro de reportes no quedara bloqueado por permiso aun teniendo plan Pro.
