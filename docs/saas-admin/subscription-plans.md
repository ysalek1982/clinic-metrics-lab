# Planes SaaS

Nutri queda preparado con tres planes comerciales principales y una concesion temporal.

| Plan | Tipo | Uso esperado | Limites/beneficios | Estado |
|---|---|---|---|---|
| `free` | Gratuito | Entrada basica individual | Limites bajos, sin admin SaaS ni premium avanzado | Preparado localmente |
| `pro` | Comercial futuro | Profesional individual | Funcionalidad principal, Copilot segun permisos, reportes y nutricion operativa | Preparado localmente |
| `clinic_hospital` | Comercial futuro institucional | Clinicas y hospitales | Multiusuario, auditoria, soporte hospitalario, enteral/parenteral | Preparado localmente |
| `courtesy` | Concesion temporal | Acceso otorgado por plataforma | Requiere vencimiento y auditoria | Preparado localmente |

Planes legacy como `professional`, `clinic`, `hospital`, `enterprise`, `trial` o `starter` quedan normalizados o desactivados por migracion comercial para evitar duplicidad.

Los beneficios se modelan en `plan_entitlements`. La UI puede usar `PlanGate`, pero la seguridad real sigue siendo combinacion de Auth, RLS, permisos y RPCs.

Pagos reales no estan integrados. No hay Stripe, tarjetas ni webhooks activos.
