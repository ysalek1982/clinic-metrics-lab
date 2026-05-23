# Modelo SaaS comercial

Nutri queda modelado con tres planes comerciales y una concesion temporal.

| Codigo | Nombre | Tipo | Objetivo | Estado |
|---|---|---|---|---|
| `free` | Free | Comercial base | Entrada basica individual con limites bajos. | Aplicado remoto. |
| `pro` | Pro | Comercial pago futuro | Profesional individual con funcionalidad completa principal. | Aplicado remoto. |
| `clinic_hospital` | Clinic/Hospital | Comercial institucional | Clinicas y hospitales con multiusuario, auditoria y soporte hospitalario. | Aplicado remoto. |
| `courtesy` | Courtesy | Concesion temporal | Acceso temporal concedido por plataforma, con vencimiento. | Aplicado remoto. |

## Reglas

- Courtesy no es un plan comercial principal; es una concesion temporal auditable.
- Billing real sigue desactivado.
- Nadie desde frontend usa service role.
- Usuario normal no puede administrar planes, permisos ni cortesias.
- `ysalek@gmail.com` debe ser `platform_superadmin` para administrar SaaS.

## Estado remoto

Aplicado en Supabase remoto de desarrollo el 2026-05-21.

Evidencia sin secretos:

- Migraciones SaaS y patches de RPC Free aplicados.
- `subscription_plans` contiene `free`, `pro`, `clinic_hospital` y `courtesy`.
- `ensure_free_subscription_for_current_user()` funciona: Marcela recibio tenant personal Free activo.
- Marcela no tiene `saas.manage` ni `platform_superadmin`.
- ysalek tiene `platform_superadmin` y permisos SaaS.

## Validacion UI autenticada

Ejecutada el 2026-05-21 contra `http://127.0.0.1:8082`.

| Plan/capacidad | Validacion | Resultado |
|---|---|---|
| Free | Marcela entra a `/app` con `free_member` y ve estado Free. | Pasa. |
| Free bloquea admin | Marcela no ve SaaS Admin y `/app/saas-admin` directo queda protegido. | Pasa. |
| Free bloquea premium | `/app/modules` muestra estados PlanGate/permisos para modulos limitados. | Pasa. |
| Pro | Visible en tab Planes de SaaS Admin. | Validado visualmente como catalogo; falta sesion Pro dedicada. |
| Clinic/Hospital | Visible en tab Planes de SaaS Admin. | Validado visualmente como catalogo; falta sesion Clinic/Hospital dedicada. |
| Courtesy | Dialogs internos para otorgar cortesia abren y cancelan sin guardar. | Validado flujo visual; falta concesion real dedicada si negocio lo requiere. |

Billing real sigue desactivado: no Stripe, no cobros, no tarjetas, no webhooks.

## Correccion comercial 2026-05-21

- Free y Pro se tratan como espacios personales, no como organizaciones institucionales.
- Free/Pro ven `Mi cuenta` / `Mi espacio`; no deben ver `Organizacion` institucional, `Usuarios`, `Roles`, `Auditoria institucional` ni `Configuracion institucional`.
- Clinic/Hospital es el primer plan institucional con `settings.manage`, `users.manage` y `audit.read` cuando el rol del tenant tambien lo permite.
- Platform Admin sigue siendo rol global de ysalek, no plan comercial.
- Se agrego guard por `planFeature` en rutas institucionales; no basta ocultar el menu.
- Migracion correctiva pendiente si no existe `SUPABASE_DB_PASSWORD`: `20260521194000_commercial_saas_institutional_entitlements.sql`.
## Fase 48 - Cierre comercial validado

Fecha: 2026-05-21.

- Free queda como cuenta personal basica con `Mi cuenta / Mi espacio`.
- Pro queda validado con usuario QA real, rol profesional y acceso a Reports.
- Clinic/Hospital queda validado con usuario QA real, rol `tenant_owner` y acceso a Organization, Users y Audit institucional.
- Courtesy queda validado con usuario QA real y con Marcela de forma temporal; tiene vencimiento y puede cancelarse.
- Platform Admin queda validado con ysalek: tab Usuarios, drawer de usuario, permisos efectivos, cambio de plan y Courtesy.
- Billing real sigue desactivado; no hay Stripe, cobros, tarjetas ni webhooks.
