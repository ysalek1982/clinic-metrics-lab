# Correccion del modelo SaaS comercial

Fecha: 2026-05-21

| Elemento | Estado actual | Problema | Correccion requerida |
|---|---|---|---|
| Free por defecto | `ensure_free_subscription_for_current_user()` crea/asegura tenant personal Free. | La UI usaba lenguaje institucional y el menu dependia demasiado de permisos. | Free se presenta como `Mi cuenta`/`Mi espacio`; administracion institucional queda fuera por plan y ruta. |
| Espacio Free | Existe tenant personal con RLS y plan `free`. | El concepto tecnico de tenant se leia como organizacion institucional. | Mantener tenant tecnico, mostrarlo como espacio personal. |
| Carga basica Free | Free mantiene pacientes/agenda basica segun permisos y entitlements. | Modulos administrativos podian aparecer si habia permisos heredados. | `moduleAccess` valida permiso + `planFeature`; Free no ve `Organizacion`, `Usuarios`, `Auditoria` ni settings institucionales. |
| Vista del plan | Existia `Subscription`, protegida por `billing.manage`. | Free no tenia una vista clara de plan/limites. | Nueva ruta `/app/account` con plan, limites, espacio y solicitudes. |
| Solicitar upgrade | Existia flujo de access requests. | No estaba conectado desde una cuenta Free activa. | `/app/account` permite solicitar upgrade o cortesia sin autoescalar. |
| Pro | Existe plan `pro`. | Debia quedar claro que es individual completo, no institucional. | Pro no recibe `settings.manage`, `users.manage`, `audit.read` ni SaaS Admin global por entitlements locales. |
| Clinic/Hospital | Existe plan `clinic_hospital`. | Debia quedar como plan institucional/equipo. | Clinic/Hospital incluye `settings.manage`, `users.manage` y `audit.read` para administracion de su tenant, no plataforma. |
| Platform Admin | ysalek/platform_superadmin tiene bypass operativo. | El bypass no debe depender de plan del tenant. | `moduleAccess` conserva `bypassPlanGate` para platform superadmin y `/app/saas-admin` sigue con `RequirePlatformAdmin`. |
| Courtesy | Existe como plan/status temporal. | No debe ser plan comercial base ni activar SaaS Admin global. | Courtesy queda como concesion temporal auditable; `saas.manage` permanece deshabilitado. |
| URL directa | Rutas institucionales estaban protegidas por permiso. | Permiso accidental podia abrir vista institucional. | `RequireTenantPermission` acepta `planFeature`; rutas de org/settings/users/audit verifican permiso + plan. |

## Respuestas de diagnostico

| Pregunta | Respuesta |
|---|---|
| ¿Free crea tenant/espacio propio? | Si. El tenant tecnico se conserva para RLS, pero se muestra como `Mi espacio`. |
| ¿Free puede cargar datos basicos? | Si, segun permisos/limites Free: pacientes limitados, antropometria/agenda basica y dashboard. |
| ¿Free puede ver su plan? | Si, por `/app/account`. |
| ¿Free puede solicitar upgrade? | Si, por solicitud de acceso desde `/app/account`; no cambia el plan automaticamente. |
| ¿ysalek puede subir Free a Pro? | Si, desde SaaS Admin, seleccionando usuario/tenant y accion `Subir a Pro`. |
| ¿ysalek puede dar Courtesy? | Si, desde SaaS Admin con `Dar cortesia 30 dias` o desde tab de suscripciones. |
| ¿Clinic/Hospital tiene administracion institucional? | Si, por `settings.manage`, `users.manage` y `audit.read` si el rol tambien lo permite. |
| ¿Pro tiene acceso completo individual? | Si para modulos premium individuales; no incluye administracion institucional ni SaaS Admin. |
| ¿Free esta limitado correctamente? | Si en menu, rutas y DB remota; la migracion `20260521194000` ya fue aplicada. |
| ¿Free ve textos de Organizacion? | No debe ver `Organizacion` institucional; ve `Mi cuenta`/`Mi espacio`. |

## Reglas finales

- Free es una cuenta personal basica, no una organizacion institucional.
- Pro es individual completo, sin administracion global/institucional avanzada.
- Clinic/Hospital es institucional y multiusuario.
- Platform Admin es un rol de plataforma, no un plan comercial.
- Courtesy es temporal, auditable y revocable.
- Billing real sigue desactivado.

## Cierre remoto Fase 47

| Control | Resultado |
|---|---|
| Migracion `20260521194000` | Aplicada al remoto de desarrollo. |
| Entitlements Free | Sin `settings.manage`, `saas.manage`, `users.manage`, `audit.read`. |
| Entitlements Clinic/Hospital | Con `settings.manage`, `users.manage`, `audit.read`; sin `saas.manage`. |
| Marcela Free | Validada con sesion real en produccion: ve `Panel de mi espacio` y `/app/account`; rutas institucionales/admin bloqueadas. |
| Vercel | Produccion actualizada con deploy `dpl_9rb6Si45w8v4f53gRZgsT7JSRz77`. |
